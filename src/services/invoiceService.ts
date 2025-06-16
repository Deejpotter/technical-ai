/**
 * Invoice Processing Service
 * Updated: June 11, 2025
 * Author: Deej Potter (Original), Migration by GitHub Copilot
 * Description: Handles invoice processing, including PDF extraction and AI-driven item detail extraction.
 */

import OpenAI from "openai";
import pdf from "pdf-parse";
import {
	ExtractedInvoiceItem,
	EstimatedItemWithDimensions,
} from "../types/invoice"; // Adjusted path
import ShippingItem from "../types/ShippingItem"; // Corrected default import

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts text content from a provided file buffer.
 * Supports PDF and plain text files.
 * @param fileBuffer Buffer containing the file content.
 * @param fileType MIME type of the file (e.g., "application/pdf", "text/plain").
 * @param fileName Original name of the file, used for extension checking if type is generic.
 * @returns {Promise<string>} Extracted text content.
 * @throws {Error} If file processing fails or content is not extractable.
 */
export async function extractTextFromFile(
	fileBuffer: Buffer,
	fileType: string,
	fileName: string
): Promise<string> {
	console.log(
		`[InvoiceService] extractTextFromFile called. fileName: ${fileName}, fileType: ${fileType}`
	);
	try {
		if (
			fileType === "application/pdf" ||
			fileName.toLowerCase().endsWith(".pdf")
		) {
			// Using pdf-parse for PDF text extraction
			const data = await pdf(fileBuffer);
			if (!data.text.trim()) {
				console.warn(`Extracted PDF text is empty for ${fileName}.`);
			}
			return data.text;
		} else if (
			fileType === "text/plain" ||
			fileName.toLowerCase().endsWith(".txt")
		) {
			const textContent = fileBuffer.toString("utf8");
			if (!textContent.trim()) {
				console.warn(`Extracted TXT content is empty for ${fileName}.`);
			}
			return textContent;
		} else {
			console.error(`Unsupported file type: ${fileType} for file ${fileName}`);
			throw new Error(
				`Unsupported file type: ${fileType}. Please upload a PDF or TXT file.`
			);
		}
	} catch (error: any) {
		console.error(
			`[InvoiceService] Error extracting text from ${fileName}:`,
			error
		);
		throw new Error(
			`Failed to extract text from ${fileName}. Error: ${error.message}`
		);
	}
}

/**
 * Processes text content with OpenAI to extract item details.
 * This function now serves as the primary AI interaction point for invoice item extraction.
 * @param {string} text - The invoice text to process.
 * @returns {Promise<ExtractedInvoiceItem[]>} A promise that resolves to an array of extracted items.
 * @throws {Error} If AI processing fails or returns unexpected data.
 */
async function processTextWithAI(
	text: string
): Promise<ExtractedInvoiceItem[]> {
	if (!text.trim()) {
		console.warn("Skipping AI processing for empty text.");
		return [];
	}

	const prompt = `
Extract all line items from the following invoice text. For each item, provide:
1. name: The full name or description of the item.
2. sku: The SKU or product code, if available. If not available, use "N/A".
3. quantity: The number of units for this item.
4. weight: The weight of a single unit of the item in kilograms (kg). If weight is per multiple units, calculate for a single unit. If not available, estimate based on the item name or use 0.

Format the output as a JSON array of objects, where each object represents an item.
The root of the response should be the JSON array itself. Example:
[
  { "name": "Item A", "sku": "SKU123", "quantity": 2, "weight": 0.5 },
  { "name": "Item B", "sku": "N/A", "quantity": 10, "weight": 0.02 }
]

Invoice Text:
---
${text}
---
JSON Output:
`;

	try {
		console.log("Sending text to OpenAI for item extraction...");
		const response = await openai.chat.completions.create({
			model: process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo-1106", // Specify a model known to support JSON mode
			messages: [{ role: "user", content: prompt }],
			temperature: 0.1, // Lower temperature for more deterministic output
			response_format: { type: "json_object" }, // Request JSON output
		});

		const messageContent = response.choices[0]?.message?.content;
		if (!messageContent) {
			throw new Error("OpenAI response content is empty.");
		}

		console.log("Raw OpenAI response:", messageContent);

		let extractedItems: ExtractedInvoiceItem[] = [];
		try {
			const parsedJson = JSON.parse(messageContent);
			// Expecting the root to be an array due to response_format and prompt.
			// However, AI can sometimes still wrap it, so we check common keys.
			if (Array.isArray(parsedJson)) {
				extractedItems = parsedJson;
			} else if (parsedJson.items && Array.isArray(parsedJson.items)) {
				extractedItems = parsedJson.items;
			} else if (parsedJson.data && Array.isArray(parsedJson.data)) {
				extractedItems = parsedJson.data;
			} else {
				// If it's an object but not the expected structure, try to find an array within it
				const arrayKey = Object.keys(parsedJson).find((key) =>
					Array.isArray(parsedJson[key])
				);
				if (arrayKey) {
					extractedItems = parsedJson[arrayKey];
					console.log(`Found items under key: ${arrayKey}`);
				} else if (
					typeof parsedJson === "object" &&
					parsedJson !== null &&
					parsedJson.name &&
					parsedJson.quantity &&
					parsedJson.weight !== undefined
				) {
					// Handle case where AI might return a single object instead of an array of one
					console.log(
						"Attempting to treat single object response as a single item array."
					);
					extractedItems = [parsedJson as ExtractedInvoiceItem];
				} else {
					throw new Error(
						"OpenAI response was valid JSON but not in the expected array format or a known wrapped structure."
					);
				}
			}
		} catch (jsonError) {
			console.error("Failed to parse OpenAI JSON response:", jsonError);
			console.error("Problematic JSON string:", messageContent);
			// Fallback: Try to extract JSON from a potentially markdown-formatted response
			// This is less likely if json_object mode works as expected, but good for resilience
			const jsonRegex = /```json\\n([\\s\\S]*?)\\n```/;
			const match = messageContent.match(jsonRegex);
			if (match && match[1]) {
				console.log("Attempting to parse JSON from markdown block...");
				try {
					const parsedJsonFromMarkdown = JSON.parse(match[1]);
					if (Array.isArray(parsedJsonFromMarkdown)) {
						extractedItems = parsedJsonFromMarkdown;
					} else if (
						parsedJsonFromMarkdown.items &&
						Array.isArray(parsedJsonFromMarkdown.items)
					) {
						extractedItems = parsedJsonFromMarkdown.items;
					} else if (
						parsedJsonFromMarkdown.data &&
						Array.isArray(parsedJsonFromMarkdown.data)
					) {
						extractedItems = parsedJsonFromMarkdown.data;
					} else {
						throw new Error(
							"JSON from markdown block was not in expected array format."
						);
					}
				} catch (markdownJsonError) {
					console.error(
						"Failed to parse JSON from markdown block:",
						markdownJsonError
					);
					throw new Error(
						"Failed to parse OpenAI JSON response, even after trying markdown extraction."
					);
				}
			} else {
				throw new Error(
					"OpenAI response was not valid JSON and no markdown block found."
				);
			}
		}

		// Validate structure of extracted items
		if (
			!Array.isArray(extractedItems) ||
			!extractedItems.every(
				(item) =>
					item && // ensure item is not null/undefined
					typeof item.name === "string" &&
					typeof item.sku === "string" && // SKU can be N/A, but should be a string
					typeof item.quantity === "number" &&
					typeof item.weight === "number"
			)
		) {
			console.error(
				"OpenAI response format is invalid. Expected an array of ExtractedInvoiceItem.",
				extractedItems
			);
			throw new Error(
				"OpenAI response format is invalid after parsing. Check logs."
			);
		}
		console.log(
			`Successfully extracted ${extractedItems.length} items from AI.`
		);
		return extractedItems;
	} catch (error: any) {
		console.error("Error processing with OpenAI:", error);
		throw new Error(`Failed to process text with AI. Error: ${error.message}`);
	}
}

/**
 * Extracts item details from invoice text using AI.
 * This is now a wrapper around processTextWithAI.
 * @param {string} text - Extracted invoice text.
 * @returns {Promise<ExtractedInvoiceItem[]>} Array of extracted items.
 */
export async function extractInvoiceItemsFromText(
	text: string
): Promise<ExtractedInvoiceItem[]> {
	console.log("Extracting invoice items from text...");
	return processTextWithAI(text);
}

/**
 * Estimates dimensions for hardware items using OpenAI.
 * @param {ExtractedInvoiceItem[]} items - Array of extracted items to estimate dimensions for.
 * @returns {Promise<EstimatedItemWithDimensions[]>} Array of items with estimated dimensions.
 */
export async function estimateItemDimensionsAI(
	items: ExtractedInvoiceItem[]
): Promise<EstimatedItemWithDimensions[]> {
	if (!items || items.length === 0) {
		console.log("No items provided for dimension estimation.");
		return [];
	}

	const itemsForPrompt = items.map((item) => ({
		name: item.name,
		sku: item.sku,
	}));

	const prompt = `
For each of the following hardware items, estimate its physical dimensions (length, width, height) for a single unit in millimeters (mm).
If an item is not a physical product or dimensions are not applicable, use 0 for length, width, and height.
Consider common sizes for items like screws, bolts, extrusions, electronics, etc.

Items:
---
${JSON.stringify(itemsForPrompt, null, 2)}
---

Return the output as a JSON array, where each object matches the input items but includes:
- length: estimated length in mm
- width: estimated width in mm
- height: estimated height in mm
The root of the response should be the JSON array itself.

Example for a single item input:
Input: [{ "name": "M5x10mm Socket Head Cap Screw", "sku": "SCR-M5-10" }]
Output: [{ "name": "M5x10mm Socket Head Cap Screw", "sku": "SCR-M5-10", "length": 10, "width": 8, "height": 8 }]
(Note: head diameter for M5 is ~8.5mm, length is 10mm. Width/Height can be approx head diameter for small screws)

JSON Output:
`;

	try {
		console.log(
			`Sending ${items.length} items to OpenAI for dimension estimation...`
		);
		const response = await openai.chat.completions.create({
			model: process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo-1106", // Specify a model known to support JSON mode
			messages: [{ role: "user", content: prompt }],
			temperature: 0.2,
			response_format: { type: "json_object" },
		});

		const messageContent = response.choices[0]?.message?.content;
		if (!messageContent) {
			throw new Error(
				"OpenAI response content is empty for dimension estimation."
			);
		}

		console.log("Raw OpenAI dimension estimation response:", messageContent);

		let estimatedItemsWithDimensionsOutput: any[] = [];
		try {
			const parsedJson = JSON.parse(messageContent);
			if (Array.isArray(parsedJson)) {
				estimatedItemsWithDimensionsOutput = parsedJson;
			} else if (parsedJson.items && Array.isArray(parsedJson.items)) {
				estimatedItemsWithDimensionsOutput = parsedJson.items;
			} else if (parsedJson.data && Array.isArray(parsedJson.data)) {
				estimatedItemsWithDimensionsOutput = parsedJson.data;
			} else {
				const arrayKey = Object.keys(parsedJson).find((key) =>
					Array.isArray(parsedJson[key])
				);
				if (arrayKey) {
					estimatedItemsWithDimensionsOutput = parsedJson[arrayKey];
				} else {
					throw new Error(
						"OpenAI dimension response was valid JSON but not in the expected array format."
					);
				}
			}
		} catch (jsonError) {
			console.error(
				"Failed to parse OpenAI JSON response for dimensions:",
				jsonError
			);
			const jsonRegex = /```json\\n([\\s\\S]*?)\\n```/;
			const match = messageContent.match(jsonRegex);
			if (match && match[1]) {
				console.log(
					"Attempting to parse dimension JSON from markdown block..."
				);
				try {
					const parsedJsonFromMarkdown = JSON.parse(match[1]);
					if (Array.isArray(parsedJsonFromMarkdown)) {
						estimatedItemsWithDimensionsOutput = parsedJsonFromMarkdown;
					} else if (
						parsedJsonFromMarkdown.items &&
						Array.isArray(parsedJsonFromMarkdown.items)
					) {
						estimatedItemsWithDimensionsOutput = parsedJsonFromMarkdown.items;
					} else {
						throw new Error(
							"Dimension JSON from markdown block was not in expected array format."
						);
					}
				} catch (markdownJsonError) {
					console.error(
						"Failed to parse dimension JSON from markdown block:",
						markdownJsonError
					);
					throw new Error(
						"Failed to parse OpenAI dimension JSON response, even after trying markdown extraction."
					);
				}
			} else {
				throw new Error(
					"OpenAI dimension response was not valid JSON and no markdown block found."
				);
			}
		}

		if (estimatedItemsWithDimensionsOutput.length !== items.length) {
			console.warn(
				`Mismatch in item count for dimension estimation. Input: ${items.length}, Output: ${estimatedItemsWithDimensionsOutput.length}`
			);
			// Attempt to reconcile or handle this discrepancy if necessary.
			// For now, we proceed, but this could lead to incorrect merging.
		}

		// Merge original items with estimated dimensions
		const result: EstimatedItemWithDimensions[] = items.map(
			(originalItem, index) => {
				// Find the corresponding estimated item.
				// Prefer matching by name and SKU, fall back to index if counts match and names/SKUs don't.
				let estimated = estimatedItemsWithDimensionsOutput.find(
					(est) =>
						est.name === originalItem.name && est.sku === originalItem.sku
				);

				// If no match by name/SKU and counts are the same, try by index (less reliable)
				if (
					!estimated &&
					estimatedItemsWithDimensionsOutput.length === items.length
				) {
					console.warn(
						`Dimension estimation for '${originalItem.name}' (SKU: ${originalItem.sku}) not found by name/SKU match. Trying by index as counts match.`
					);
					estimated = estimatedItemsWithDimensionsOutput[index];
				}

				if (estimated) {
					return {
						...originalItem,
						length: typeof estimated.length === "number" ? estimated.length : 0,
						width: typeof estimated.width === "number" ? estimated.width : 0,
						height: typeof estimated.height === "number" ? estimated.height : 0,
					};
				}
				console.warn(
					`No dimension estimation found for item: ${originalItem.name} (SKU: ${originalItem.sku}). Defaulting to 0 dimensions.`
				);
				return {
					...originalItem,
					length: 0,
					width: 0,
					height: 0,
				};
			}
		);
		console.log(
			`Successfully estimated dimensions for ${
				result.filter((r) => r.length > 0 || r.width > 0 || r.height > 0).length
			} items.`
		);
		return result;
	} catch (error: any) {
		console.error("Error estimating item dimensions with AI:", error);
		throw new Error(
			`Failed to estimate item dimensions. Error: ${error.message}`
		);
	}
}

/**
 * Logs a warning for items with suspiciously high weights.
 * @param {Object} item - The item to check (should have name, sku, weight).
 * @param {string} source - A string indicating the source of the item data (e.g., "DB", "AI Estimation").
 */
function logSuspiciousWeight(
	item: { name: string; sku: string; weight: number },
	source: string
) {
	const SUSPICIOUS_WEIGHT_THRESHOLD_KG = 50;
	if (item.weight > SUSPICIOUS_WEIGHT_THRESHOLD_KG) {
		console.warn(
			`[Suspicious Weight] Item "${item.name}" (SKU: ${item.sku}) from ${source} has a high weight: ${item.weight} kg.`
		);
	}
}

// Placeholder for database interaction
const db = {
	shippingItem: {
		findUnique: async (args: {
			where: { sku: string };
		}): Promise<ShippingItem | null> => {
			console.log(`DB_SIM: Checking for SKU: ${args.where.sku}`);
			// Simulate finding an item for type correctness and testing
			if (args.where.sku === "EXISTING_SKU_EXAMPLE") {
				return {
					_id: "mongoId123",
					name: "Example Existing Item",
					sku: args.where.sku,
					length: 100,
					width: 50,
					height: 20,
					weight: 500,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
			}
			// Simulate not finding an item for other SKUs
			return null;
		},
		create: async (args: {
			data: Omit<ShippingItem, "_id" | "createdAt" | "updatedAt">;
		}): Promise<ShippingItem> => {
			console.log(
				`DB_SIM: Creating item: ${args.data.name} (SKU: ${args.data.sku})`
			);
			const newItem: ShippingItem = {
				_id: `SIM_MONGO_ID_${Date.now()}_${Math.random()
					.toString(36)
					.substring(2, 9)}`,
				...args.data,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			return newItem;
		},
		update: async (args: {
			where: { sku: string };
			data: Partial<Omit<ShippingItem, "_id" | "createdAt" | "updatedAt">>;
		}): Promise<ShippingItem> => {
			console.log(
				`DB_SIM: Updating item: ${args.where.sku} with data: ${JSON.stringify(
					args.data
				)}`
			);
			// Simulate finding and updating. For now, just return a structure assuming it was found.
			// In a real scenario, you\'d fetch the existing item first.
			const updatedItem: ShippingItem = {
				_id: "EXISTING_MONGO_ID", // Placeholder for actual ID that would be found
				name: args.data.name || "Updated Name",
				sku: args.where.sku,
				length: args.data.length || 0,
				width: args.data.width || 0,
				height: args.data.height || 0,
				weight: args.data.weight || 0, // weight in grams
				createdAt: new Date(Date.now() - 100000), // Older date
				updatedAt: new Date(),
			};
			return updatedItem;
		},
	},
};

/**
 * Retrieves existing shipping items or creates new ones based on extracted invoice data.
 * It now includes dimension estimation and passes userId for item creation/update.
 * @param {EstimatedItemWithDimensions[]} itemsWithDimensions - Items extracted and processed by AI, including dimensions.
 * @returns {Promise<ShippingItem[]>} Array of existing or newly created/updated shipping items.
 *          The quantity in the returned ShippingItem reflects the quantity from THIS invoice.
 */
export async function getOrCreateShippingItemsFromInvoice(
	itemsWithDimensions: EstimatedItemWithDimensions[]
	// userId: string // Removed: Shipping items are now global
): Promise<ShippingItem[]> {
	if (!itemsWithDimensions || itemsWithDimensions.length === 0) {
		return [];
	}

	const shippingItemsResult: ShippingItem[] = [];

	for (const item of itemsWithDimensions) {
		logSuspiciousWeight(item, `AI Estimation (Invoice: ${item.name})`);

		// Data to be used for creating or updating a ShippingItem in the DB
		// Note: item.weight is from AI in KG, ShippingItem.weight is in grams.
		// item.quantity is from the invoice.
		const itemDataForDb: Omit<ShippingItem, "_id" | "createdAt" | "updatedAt"> =
			{
				name: item.name,
				sku:
					item.sku ||
					`TEMP_SKU_${Date.now()}_${Math.random()
						.toString(36)
						.substring(2, 7)}`,
				length: item.length, // mm
				width: item.width, // mm
				height: item.height, // mm
				weight: item.weight * 1000, // Convert kg to grams
				// userId: userId, // Removed: Shipping items are now global
				// category: "Auto-Processed", // Default category
				// notes: `Auto-generated from invoice processing on ${new Date().toISOString()}. Original quantity: ${
				// 	item.quantity
				// }.`,
				// imageUrl can be added if a system for it exists
			};

		let finalShippingItem: ShippingItem;
		// Removed userId from findUnique query
		const existingItem = await db.shippingItem.findUnique({
			where: { sku: itemDataForDb.sku },
		});

		if (existingItem) {
			console.log(
				`Found existing item with SKU: ${itemDataForDb.sku}. Simulating update.`
			);
			// If item exists, update it with new details if necessary, but retain its _id.
			// The transactional quantity from the invoice is what we want to reflect in the returned item.
			finalShippingItem = await db.shippingItem.update({
				where: { sku: itemDataForDb.sku }, // Removed userId from where clause
				data: {
					name: itemDataForDb.name, // Update name if changed
					length: itemDataForDb.length, // Update dimensions
					width: itemDataForDb.width,
					height: itemDataForDb.height,
					weight: itemDataForDb.weight, // Update weight
					// DO NOT update existingItem.quantity (master stock) here directly.
					// The quantity in itemDataForDb is the transactional quantity.
				},
			});
		} else {
			console.log(
				`No existing item with SKU: ${itemDataForDb.sku}. Simulating creation.`
			);
			// Create a new ShippingItem with all details, including the transactional quantity.
			finalShippingItem = await db.shippingItem.create({ data: itemDataForDb });
		}

		shippingItemsResult.push(finalShippingItem);
	}
	console.log(
		`Processed ${shippingItemsResult.length} items into ShippingItem format (simulated DB).`
	);
	return shippingItemsResult;
}

/**
 * Main service function to process an invoice file (PDF or TXT).
 * It extracts text, then uses AI to get item details and estimate dimensions,
 * and finally attempts to get or create these items in the (simulated) database,
 * associating them with the provided userId.
 *
 * @param fileBuffer Buffer of the uploaded file.
 * @param fileType MIME type of the file.
 * @param fileName Original name of the file.
 * @param userId The ID of the user uploading the invoice, used for associating/creating items.
 * @returns {Promise<EstimatedItemWithDimensions[]>} A promise that resolves to an array of items
 *          with name, sku, quantity (from invoice), weight (kg), and estimated dimensions (mm).
 *          These are the items as extracted and estimated, *before* DB interaction transforms them into full ShippingItem structure.
 */
export async function processInvoiceFileAndExtractItems(
	fileBuffer: Buffer,
	fileType: string,
	fileName: string
	// userId: string // Removed: No longer needed as items are global
): Promise<EstimatedItemWithDimensions[]> {
	console.log(`Starting processing for file: ${fileName}, type: ${fileType}`);

	// Step 1: Extract text from the file
	const extractedText = await extractTextFromFile(
		fileBuffer,
		fileType,
		fileName
	);
	if (!extractedText.trim()) {
		console.warn(
			`No text extracted from ${fileName}, skipping further processing.`
		);
		return [];
	}
	console.log(
		`Successfully extracted text from ${fileName}. Length: ${extractedText.length}`
	);

	// Step 2: Extract structured item data (name, sku, quantity, weight) using AI
	const extractedItems = await extractInvoiceItemsFromText(extractedText);
	if (!extractedItems || extractedItems.length === 0) {
		console.warn(
			`No items extracted by AI from ${fileName}. Returning empty array.`
		);
		return [];
	}
	console.log(
		`Successfully extracted ${extractedItems.length} items using AI from ${fileName}.`
	);

	// Step 3: Estimate dimensions for the extracted items using AI
	const itemsWithDimensions = await estimateItemDimensionsAI(extractedItems);
	console.log(
		`Successfully estimated dimensions for ${itemsWithDimensions.length} items from ${fileName}.`
	);

	// Step 4: Get or create ShippingItem records (now global, no userId)
	// The result of this step is not directly returned by this function as per its signature,
	// but it ensures items are in the DB. The function returns EstimatedItemWithDimensions.
	// If the goal was to return ShippingItem[], the signature and logic would change.
	await getOrCreateShippingItemsFromInvoice(itemsWithDimensions);
	console.log(
		`Finished getOrCreateShippingItemsFromInvoice for ${itemsWithDimensions.length} items from ${fileName}.`
	);

	return itemsWithDimensions;
}
