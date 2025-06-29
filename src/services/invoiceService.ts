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
import { DataService } from "../data/DataService"; // Import DataService for DB operations
import ShippingItem from "../types/ShippingItem"; // Corrected default import

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is set in your environment variables
// For tests, we'll handle missing API key gracefully
const openai = process.env.OPENAI_API_KEY
	? new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
	  })
	: null;

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
 * Removes personal data (names, emails, phone numbers, addresses) from extracted invoice text.
 * Uses regex patterns to scrub common PII. Extend as needed for more robust scrubbing.
 * @param text The extracted invoice text.
 * @returns The text with personal data removed or replaced.
 */
export function removePersonalData(text: string): string {
	if (!text.trim()) return text;
	let scrubbed = text;
	// Remove emails
	scrubbed = scrubbed.replace(
		/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
		"[REDACTED_EMAIL]"
	);
	// Remove phone numbers (simple patterns)
	scrubbed = scrubbed.replace(
		/(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g,
		"[REDACTED_PHONE]"
	);
	// Remove addresses (very basic, just street numbers and names)
	scrubbed = scrubbed.replace(
		/\d{1,5} [\w .,'-]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
		"[REDACTED_ADDRESS]"
	);
	// Remove names (if you have a list of known names, otherwise skip)
	// Add more patterns as needed
	return scrubbed;
}

/**
 * Processes text content with OpenAI to extract item details using function calling.
 * This function uses OpenAI function calling to ensure proper structured output for multiple items.
 * Weight extraction is minimal since we prioritize DB weights over AI estimates.
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

	// Define the function schema for extracting invoice items
	const extractItemsFunction = {
		name: "extract_invoice_items",
		description: "Extract all line items from an invoice with their details",
		parameters: {
			type: "object",
			properties: {
				items: {
					type: "array",
					description: "Array of all items found in the invoice",
					items: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "Full name or description of the item",
							},
							sku: {
								type: "string",
								description:
									"SKU, product code, part number, or model number. If no explicit SKU is found, create a meaningful one based on the item name (e.g., 'BOLT-M6-20' for M6x20 bolt). NEVER use 'N/A', 'UNKNOWN', 'NONE', or any placeholder text. Every item must have a valid, specific SKU.",
							},
							quantity: {
								type: "number",
								description: "Number of units of this item from the invoice",
							},
							weight: {
								type: "number",
								description:
									"Estimated weight of a single unit in kg. Use 0 if unknown - we'll get actual weight from database",
							},
						},
						required: ["name", "sku", "quantity", "weight"],
					},
				},
			},
			required: ["items"],
		},
	};

	const prompt = `Extract ALL line items from this invoice. Each item should include:
- Complete item name/description as shown on invoice
- SKU/product code/part number. If no explicit SKU exists, create a meaningful one based on the item description (e.g., "BOLT-M6-20" for M6x20 bolt, "RAIL-2040-500" for 2040 extrusion 500mm length). ABSOLUTELY NEVER use "N/A", "UNKNOWN", "NONE", or any placeholder text as SKU values - every item must have a real, specific SKU.
- Exact quantity from the invoice
- Estimated weight per unit in kg (or 0 if unknown - we'll get actual weight from database)

Make sure to extract EVERY item shown in the invoice, not just the first one.
Focus on actual physical products that need to be shipped - ignore service charges, shipping fees, taxes, etc.
Ensure every extracted item has a valid, meaningful SKU - no placeholders allowed.

Invoice Text:
---
${text}
---`;

	try {
		console.log(
			"Sending text to OpenAI for item extraction using function calling..."
		);
		if (!openai) {
			throw new Error(
				"OpenAI client not initialized. Please ensure OPENAI_API_KEY is set."
			);
		}
		const response = await openai.chat.completions.create({
			model: process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo-1106",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.1, // Lower temperature for more deterministic output
			functions: [extractItemsFunction],
			function_call: { name: "extract_invoice_items" },
		});

		const functionCall = response.choices[0]?.message?.function_call;
		if (!functionCall || functionCall.name !== "extract_invoice_items") {
			throw new Error("OpenAI did not return the expected function call.");
		}

		const functionArgs = functionCall.arguments;
		if (!functionArgs) {
			throw new Error("OpenAI function call has no arguments.");
		}

		console.log("Raw OpenAI function call response:", functionArgs);

		let extractedItems: ExtractedInvoiceItem[] = [];
		try {
			const parsedArgs = JSON.parse(functionArgs);
			if (parsedArgs.items && Array.isArray(parsedArgs.items)) {
				extractedItems = parsedArgs.items;
			} else {
				throw new Error("Function call response missing 'items' array");
			}
		} catch (jsonError) {
			console.error(
				"Failed to parse OpenAI function call arguments:",
				jsonError
			);
			console.error("Problematic JSON string:", functionArgs);
			throw new Error(`Failed to parse function call response: ${jsonError}`);
		}

		// Validate structure of extracted items
		if (
			!Array.isArray(extractedItems) ||
			!extractedItems.every(
				(item) =>
					item && // ensure item is not null/undefined
					typeof item.name === "string" &&
					typeof item.sku === "string" &&
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

		// Additional validation: reject items with invalid SKUs
		const invalidSkuItems = extractedItems.filter(
			(item) =>
				!item.sku ||
				item.sku.trim() === "" ||
				item.sku.toUpperCase().includes("N/A") ||
				item.sku.toUpperCase().includes("UNKNOWN") ||
				item.sku.toUpperCase().includes("NONE")
		);

		if (invalidSkuItems.length > 0) {
			console.warn(
				"Found items with invalid SKUs:",
				invalidSkuItems.map((item) => ({ name: item.name, sku: item.sku }))
			);
			// Filter out items with invalid SKUs rather than failing completely
			extractedItems = extractedItems.filter(
				(item) =>
					item.sku &&
					item.sku.trim() !== "" &&
					!item.sku.toUpperCase().includes("N/A") &&
					!item.sku.toUpperCase().includes("UNKNOWN") &&
					!item.sku.toUpperCase().includes("NONE")
			);
			console.log(
				`Filtered out ${invalidSkuItems.length} items with invalid SKUs. ${extractedItems.length} valid items remaining.`
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
 * Estimates dimensions for hardware items using OpenAI function calling.
 * This function uses OpenAI function calling to ensure proper structured output for dimension estimation.
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

	// Define the function schema for estimating dimensions
	const estimateDimensionsFunction = {
		name: "estimate_item_dimensions",
		description: "Estimate physical dimensions for hardware items",
		parameters: {
			type: "object",
			properties: {
				items: {
					type: "array",
					description: "Array of items with estimated dimensions",
					items: {
						type: "object",
						properties: {
							name: {
								type: "string",
								description: "Original item name",
							},
							sku: {
								type: "string",
								description: "Original item SKU",
							},
							length: {
								type: "number",
								description: "Estimated length in millimeters (mm)",
							},
							width: {
								type: "number",
								description: "Estimated width in millimeters (mm)",
							},
							height: {
								type: "number",
								description: "Estimated height in millimeters (mm)",
							},
						},
						required: ["name", "sku", "length", "width", "height"],
					},
				},
			},
			required: ["items"],
		},
	};

	const itemsForPrompt = items.map((item) => ({
		name: item.name,
		sku: item.sku,
	}));

	const prompt = `Estimate physical dimensions for each hardware item. For a single unit in millimeters (mm).
If an item is not a physical product or dimensions are not applicable, use 0 for all dimensions.
Consider common sizes for items like screws, bolts, extrusions, electronics, etc.

Items to estimate:
${JSON.stringify(itemsForPrompt, null, 2)}

Return dimensions for ALL items in the same order provided.`;

	try {
		console.log(
			`Sending ${items.length} items to OpenAI for dimension estimation using function calling...`
		);
		if (!openai) {
			throw new Error(
				"OpenAI client not initialized. Please ensure OPENAI_API_KEY is set."
			);
		}
		const response = await openai.chat.completions.create({
			model: process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo-1106",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.1, // Lower temperature for more deterministic output
			functions: [estimateDimensionsFunction],
			function_call: { name: "estimate_item_dimensions" },
		});

		const functionCall = response.choices[0]?.message?.function_call;
		if (!functionCall || functionCall.name !== "estimate_item_dimensions") {
			throw new Error(
				"OpenAI did not return the expected function call for dimension estimation."
			);
		}

		const functionArgs = functionCall.arguments;
		if (!functionArgs) {
			throw new Error(
				"OpenAI function call has no arguments for dimension estimation."
			);
		}

		console.log("Raw OpenAI dimension function call response:", functionArgs);

		let estimatedDimensions: any[] = [];
		try {
			const parsedArgs = JSON.parse(functionArgs);
			if (parsedArgs.items && Array.isArray(parsedArgs.items)) {
				estimatedDimensions = parsedArgs.items;
			} else {
				throw new Error(
					"Function call response missing 'items' array for dimensions"
				);
			}
		} catch (jsonError) {
			console.error(
				"Failed to parse OpenAI dimension function call arguments:",
				jsonError
			);
			console.error("Problematic JSON string:", functionArgs);
			throw new Error(
				`Failed to parse dimension function call response: ${jsonError}`
			);
		}

		// Validate structure of estimated dimensions
		if (
			!Array.isArray(estimatedDimensions) ||
			!estimatedDimensions.every(
				(item) =>
					item && // ensure item is not null/undefined
					typeof item.name === "string" &&
					typeof item.sku === "string" &&
					typeof item.length === "number" &&
					typeof item.width === "number" &&
					typeof item.height === "number"
			)
		) {
			console.error(
				"OpenAI dimension response format is invalid. Expected an array of dimension objects.",
				estimatedDimensions
			);
			throw new Error(
				"OpenAI dimension response format is invalid after parsing. Check logs."
			);
		}

		if (estimatedDimensions.length !== items.length) {
			console.warn(
				`Mismatch in item count for dimension estimation. Input: ${items.length}, Output: ${estimatedDimensions.length}`
			);
		}

		// Merge original items with estimated dimensions
		const result: EstimatedItemWithDimensions[] = items.map(
			(originalItem, index) => {
				// Find the corresponding estimated item by name and SKU match, fall back to index
				let estimated = estimatedDimensions.find(
					(est) =>
						est.name === originalItem.name && est.sku === originalItem.sku
				);

				// If no match by name/SKU and counts are the same, try by index (less reliable)
				if (!estimated && estimatedDimensions.length === items.length) {
					console.warn(
						`Dimension estimation for '${originalItem.name}' (SKU: ${originalItem.sku}) not found by name/SKU match. Trying by index as counts match.`
					);
					estimated = estimatedDimensions[index];
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
			} items using function calling.`
		);
		return result;
	} catch (error: any) {
		console.error(
			"Error estimating item dimensions with AI function calling:",
			error
		);
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

/**
 * Main modular workflow for processing an invoice file with proper quantity and weight handling.
 * Steps:
 * 1. Extract text from file
 * 2. Remove personal data
 * 3. Parse items from text using function calling
 * 4. For each item, check DB for SKU; if found, use DB data with invoice quantity
 * 5. If SKU not found, estimate with AI and optionally add to DB
 * Returns a type-safe, clear response for the frontend that preserves quantities.
 */
export async function processInvoiceFileModular(
	fileBuffer: Buffer,
	fileType: string,
	fileName: string
): Promise<EstimatedItemWithDimensions[]> {
	console.log(
		`[Modular] Starting modular invoice processing for ${fileName}...`
	);

	// Step 1: Extract text from file
	const extractedText = await extractTextFromFile(
		fileBuffer,
		fileType,
		fileName
	);
	if (!extractedText.trim()) {
		console.warn(`[Modular] No text extracted from ${fileName}, skipping.`);
		return [];
	}

	// Step 2: Remove personal data
	const scrubbedText = removePersonalData(extractedText);
	console.log(`[Modular] Personal data removed from extracted text.`);

	// Step 3: Parse items from text using function calling
	const extractedItems = await extractInvoiceItemsFromText(scrubbedText);
	if (!extractedItems || extractedItems.length === 0) {
		console.warn(
			`[Modular] No items extracted by AI from ${fileName}. Returning empty array.`
		);
		return [];
	}

	console.log(
		`[Modular] Extracted ${extractedItems.length} items from AI function calling.`
	);

	// Step 4: Process each item - check DB first, then AI estimation if needed
	const finalItems: EstimatedItemWithDimensions[] = [];

	// Get all available items from DB for efficient lookup
	const dbResponse = await DataService.shippingItems.getAvailable();
	const dbItems = dbResponse.success && dbResponse.data ? dbResponse.data : [];
	const dbItemsBySku = new Map(
		dbItems.map((item) => [item.sku.trim().toUpperCase(), item])
	);

	console.log(
		`[Modular] Loaded ${dbItems.length} items from database for lookup.`
	);

	for (const item of extractedItems) {
		const normalizedSku = item.sku.trim().toUpperCase();
		console.log(
			`[Modular] Processing item: ${item.name} (SKU: ${normalizedSku}, Qty: ${item.quantity})`
		);

		const dbItem = dbItemsBySku.get(normalizedSku);

		if (dbItem) {
			console.log(
				`[Modular] Found SKU in DB: ${normalizedSku}, using DB weight: ${dbItem.weight}g`
			);
			// Use DB data but preserve invoice quantity
			finalItems.push({
				...item, // Preserves name, sku, quantity from invoice
				length: dbItem.length,
				width: dbItem.width,
				height: dbItem.height,
				// Use DB weight (convert grams to kg for consistency with AI estimates)
				weight: dbItem.weight / 1000,
			});
		} else {
			console.log(
				`[Modular] SKU not found in DB, estimating with AI: ${normalizedSku}`
			);
			try {
				const estimatedItems = await estimateItemDimensionsAI([item]);
				if (estimatedItems && estimatedItems.length > 0) {
					const estimated = estimatedItems[0];
					console.log(`[Modular] AI estimation successful for: ${item.name}`);

					// Optionally add new item to DB for future use
					// This preserves the estimated data and makes subsequent processing faster
					try {
						console.log(
							`[Modular] Adding new item to DB: ${estimated.name} (SKU: ${normalizedSku})`
						);
						await DataService.shippingItems.add({
							name: estimated.name,
							sku: normalizedSku,
							length: estimated.length,
							width: estimated.width,
							height: estimated.height,
							weight: estimated.weight * 1000, // Convert kg to grams for DB storage
						});
						console.log(
							`[Modular] Successfully added ${estimated.name} to database.`
						);
					} catch (dbError) {
						console.warn(
							`[Modular] Failed to add item to DB (${estimated.name}), continuing with estimation:`,
							dbError
						);
						// Continue processing even if DB addition fails
					}

					finalItems.push(estimated);
				} else {
					console.warn(
						`[Modular] AI estimation returned empty for: ${item.name}, using default dimensions`
					);
					// Fallback: Use default dimensions if AI estimation fails
					finalItems.push({
						...item,
						length: 0,
						width: 0,
						height: 0,
					});
				}
			} catch (error) {
				console.error(
					`[Modular] AI estimation failed for: ${item.name}`,
					error
				);
				// Fallback: Use default dimensions if AI estimation throws an error
				finalItems.push({
					...item,
					length: 0,
					width: 0,
					height: 0,
				});
			}
		}
	}

	console.log(
		`[Modular] Finished modular invoice processing for ${fileName}. Processed ${finalItems.length} items.`
	);
	console.log(
		`[Modular] Items with quantities:`,
		finalItems.map((item) => ({
			name: item.name,
			sku: item.sku,
			quantity: item.quantity,
		}))
	);

	return finalItems;
}
