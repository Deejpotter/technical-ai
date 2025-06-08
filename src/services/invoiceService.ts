/**
 * Invoice Processing Service
 * Updated: 08/07/2025
 * Author: Deej Potter (Original), Migration by GitHub Copilot
 * Description: Handles invoice processing, including PDF extraction and AI-driven item detail extraction.
 * This service is migrated from `sample code/app/actions/processInvoice.ts` for use in an Express backend.
 */

import OpenAI from "openai";
import { pdfToText } from "pdf-ts";
import ShippingItem from "../types/ShippingItem";
import { DataService } from "../data/DataService";
import { logger } from "../utils/logger"; // Corrected logger import
import {
	ExtractedInvoiceItem,
	EstimatedItemWithDimensions,
} from "../types/invoice";

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
	if (!fileBuffer || fileBuffer.length === 0) {
		logger.error(
			"extractTextFromFile: No file buffer provided or buffer is empty."
		);
		throw new Error("No file content provided.");
	}

	let textContent: string;

	if (
		fileType === "application/pdf" ||
		fileName.toLowerCase().endsWith(".pdf")
	) {
		try {
			// pdf-ts expects Uint8Array. Buffer can be converted.
			const uint8Array = new Uint8Array(fileBuffer);
			textContent = await pdfToText(uint8Array);
			if (!textContent) {
				logger.warn(
					"extractTextFromFile: pdfToText returned empty or undefined text for PDF.",
					{ fileName }
				);
				throw new Error("pdfToText returned empty or undefined text.");
			}
		} catch (error: any) {
			logger.error("extractTextFromFile: Failed to extract text from PDF.", {
				fileName,
				error: error.message,
			});
			throw new Error(`Failed to extract text from PDF: ${error.message}`);
		}
	} else if (
		fileType === "text/plain" ||
		fileName.toLowerCase().endsWith(".txt")
	) {
		try {
			textContent = fileBuffer.toString("utf-8");
			if (!textContent) {
				logger.warn(
					"extractTextFromFile: toString returned empty or undefined text for text file.",
					{ fileName }
				);
				throw new Error("Text file content is empty or unreadable.");
			}
		} catch (error: any) {
			logger.error(
				"extractTextFromFile: Failed to extract text from plain text file.",
				{ fileName, error: error.message }
			);
			throw new Error(
				`Failed to extract text from plain text file: ${error.message}`
			);
		}
	} else {
		logger.error("extractTextFromFile: Unsupported file type.", {
			fileType,
			fileName,
		});
		throw new Error(
			`Unsupported file type: ${fileType || fileName.split(".").pop()}`
		);
	}

	if (typeof textContent !== "string") {
		logger.error(
			"extractTextFromFile: Extracted file content is not a string.",
			{ fileName }
		);
		throw new Error("Extracted file content is not a string.");
	}
	if (!textContent.trim()) {
		logger.warn(
			"extractTextFromFile: File appears to be empty or unreadable after processing.",
			{ fileName }
		);
		throw new Error("File appears to be empty or unreadable.");
	}
	logger.info("extractTextFromFile: Text extracted successfully.", {
		fileName,
	});
	return textContent;
}

/**
 * Processes text content with OpenAI to extract item details.
 * @param {string} text - The invoice text to process.
 * @returns {Promise<ExtractedInvoiceItem[]>} A promise that resolves to an array of extracted items.
 * @throws {Error} If AI processing fails or returns unexpected data.
 */
async function processWithAI(text: string): Promise<ExtractedInvoiceItem[]> {
	if (!text || !text.trim()) {
		logger.warn("processWithAI: Input text is empty.");
		throw new Error("Input text for AI processing is empty.");
	}
	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: `Extract item details from invoice text. Return only the structured data. Make sure you get the SKU and quantity exactly correct.
                    
                    The SKU and LCN can be very similar, so ensure you extract the SKU correctly:

                    LCN: D-06-V
                    LCN: E-06-T
                    LCN: G09

                    SKU: ELEC-VFD-1500
                    SKU: TR-BS-SFU1204-300
                    SKU: LR-40-8-4080-S-3050

                    I want the SKU. Weight should be in kilograms (kg). If weight is in grams, convert it. If not specified, estimate it.
                    If a dimension is present, assume it is in mm.
                    `,
				},
				{
					role: "user",
					content: text,
				},
			],
			functions: [
				{
					name: "process_invoice_items",
					description: "Process and structure invoice items",
					parameters: {
						type: "object",
						properties: {
							items: {
								type: "array",
								items: {
									type: "object",
									properties: {
										name: { type: "string" },
										sku: { type: "string" },
										weight: {
											type: "number",
											description:
												"Weight in kg. Convert from grams if necessary. Estimate if not specified.",
										},
										quantity: { type: "integer" },
									},
									required: ["name", "sku", "weight", "quantity"],
								},
							},
						},
						required: ["items"],
					},
				},
			],
			function_call: { name: "process_invoice_items" },
			temperature: 0.1,
		});

		const functionCall = response.choices[0]?.message?.function_call;
		if (!functionCall?.arguments) {
			logger.error(
				"processWithAI: No function call arguments received from OpenAI."
			);
			throw new Error("No function call arguments received from OpenAI.");
		}

		const parsedArgs = JSON.parse(functionCall.arguments);
		if (!parsedArgs.items || !Array.isArray(parsedArgs.items)) {
			logger.error(
				"processWithAI: Parsed arguments from OpenAI do not contain a valid 'items' array.",
				{ args: functionCall.arguments }
			);
			throw new Error("AI response does not contain a valid 'items' array.");
		}
		logger.info("processWithAI: Items extracted successfully by AI.", {
			itemCount: parsedArgs.items.length,
		});
		return parsedArgs.items as ExtractedInvoiceItem[];
	} catch (error: any) {
		if (
			error?.error?.type === "invalid_request_error" &&
			error?.error?.code === "context_length_exceeded"
		) {
			logger.warn("processWithAI: OpenAI context length exceeded.", {
				error: error.message,
			});
			throw new Error(
				"Invoice text is too long for AI processing. Please try with a shorter invoice or chunk the text."
			);
		}
		logger.error("processWithAI: Failed to process invoice text with AI.", {
			error: error.message,
		});
		throw new Error(`Failed to process invoice with AI: ${error.message}`);
	}
}

/**
 * Extracts item details from invoice text using AI.
 * @param {string} text - Extracted invoice text.
 * @returns {Promise<ExtractedInvoiceItem[]>} Array of extracted items.
 */
export async function extractInvoiceItemsFromText(
	text: string
): Promise<ExtractedInvoiceItem[]> {
	logger.info("extractInvoiceItemsFromText: Starting AI item extraction.");
	return await processWithAI(text);
}

/**
 * Estimates dimensions for hardware items using OpenAI.
 * @param {ExtractedInvoiceItem[]} items - Array of extracted items to estimate dimensions for.
 * @returns {Promise<EstimatedItemWithDimensions[]>} Array of items with estimated dimensions.
 */
async function estimateItemDimensionsAI(
	items: ExtractedInvoiceItem[]
): Promise<EstimatedItemWithDimensions[]> {
	if (!items || items.length === 0) {
		logger.info(
			"estimateItemDimensionsAI: No items provided for dimension estimation."
		);
		return [];
	}
	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini", // Consider making this configurable
			messages: [
				{
					role: "system",
					content: `
                        Estimate dimensions for hardware items in millimeters (mm) and ensure weights are in kilograms (kg).
                        If the provided item weight is in grams, convert it to kg. If weight is missing, estimate it in kg.
                        Consider:
                        - Standard hardware sizes
                        - Packaging for multi-packs (estimate dimensions for a single unit)
                        - Common engineering dimensions
                        - Item descriptions and SKUs
                        Return conservative estimates that would fit the items. Dimensions (length, width, height) must be in millimeters.

                        Here are some weights per mm for common extrusion profiles (provide final weight in kg):
                        - 20 x 20mm - 20 Series: 0.49g/mm -> 0.00049 kg/mm
                        - 20 x 40mm - 20 Series: 0.8g/mm -> 0.0008 kg/mm
                        - 40 x 40mm - 40 Series: 1.57g/mm -> 0.00157 kg/mm
                        - C-beam - 20 Series: 2.065g/mm -> 0.002065 kg/mm
                    `,
				},
				{
					role: "user",
					content: JSON.stringify(
						items.map((item) => ({
							name: item.name,
							sku: item.sku,
							quantity: item.quantity,
							weight_kg: item.weight,
						}))
					), // Pass weight as weight_kg
				},
			],
			functions: [
				{
					name: "estimate_dimensions",
					description: "Estimate physical dimensions for hardware items",
					parameters: {
						type: "object",
						properties: {
							items: {
								type: "array",
								items: {
									type: "object",
									properties: {
										name: { type: "string" },
										sku: { type: "string" },
										length: {
											type: "number",
											description: "Length in millimeters (mm)",
										},
										width: {
											type: "number",
											description: "Width in millimeters (mm)",
										},
										height: {
											type: "number",
											description: "Height in millimeters (mm)",
										},
										weight: {
											type: "number",
											description: "Weight in kilograms (kg)",
										},
										quantity: { type: "integer" }, // Keep quantity for context if needed by AI
									},
									required: [
										"name",
										"sku",
										"length",
										"width",
										"height",
										"weight",
										"quantity",
									],
								},
							},
						},
						required: ["items"],
					},
				},
			],
			function_call: { name: "estimate_dimensions" },
			temperature: 0.1,
		});

		const functionCall = response.choices[0]?.message?.function_call;
		if (!functionCall?.arguments) {
			logger.error(
				"estimateItemDimensionsAI: No function call arguments received from OpenAI for dimension estimation."
			);
			throw new Error("No dimension estimates received from OpenAI.");
		}

		const parsedArgs = JSON.parse(functionCall.arguments);
		if (!parsedArgs.items || !Array.isArray(parsedArgs.items)) {
			logger.error(
				"estimateItemDimensionsAI: Parsed arguments from OpenAI do not contain a valid 'items' array for dimensions.",
				{ args: functionCall.arguments }
			);
			throw new Error(
				"AI response for dimensions does not contain a valid 'items' array."
			);
		}

		// Map AI response back, ensuring original quantity is preserved if AI doesn't return it or modifies it.
		// Also, ensure the weight from AI (expected in kg) is used.
		const estimatedItemsWithDimensions: EstimatedItemWithDimensions[] =
			parsedArgs.items.map((aiItem: any) => {
				const originalItem = items.find(
					(item) => item.sku === aiItem.sku && item.name === aiItem.name
				);
				return {
					name: aiItem.name,
					sku: aiItem.sku,
					weight: aiItem.weight, // This should be in KG from AI
					quantity: originalItem ? originalItem.quantity : aiItem.quantity, // Preserve original quantity
					length: aiItem.length,
					width: aiItem.width,
					height: aiItem.height,
				};
			});
		logger.info(
			"estimateItemDimensionsAI: Dimensions estimated successfully by AI.",
			{ itemCount: estimatedItemsWithDimensions.length }
		);
		return estimatedItemsWithDimensions;
	} catch (error: any) {
		logger.error(
			"estimateItemDimensionsAI: Dimension estimation with AI failed. Falling back to default dimensions.",
			{ error: error.message }
		);
		// Fallback to default dimensions if AI estimation fails
		return items.map((item) => ({
			...item, // name, sku, weight (original in kg), quantity
			length: 50, // Default length in mm
			width: 50, // Default width in mm
			height: 50, // Default height in mm
		}));
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
	// Assuming item.weight is in kg. 1000kg is very high for typical items.
	// Original logic was 1000g (1kg). Adjusting threshold to 10kg for suspicion.
	if (
		item.weight > 10 && // If weight is > 10kg
		!/extrusion|beam|motor|psu|power|controller|vfd|spindle|linear|lead|box|enclosure|machine|assembly/i.test(
			item.name
		)
	) {
		logger.warn(
			`[logSuspiciousWeight] Suspiciously high weight (${item.weight}kg) for item '${item.name}' (SKU: ${item.sku}) from ${source}.`,
			item
		);
	}
}

/**
 * Retrieves or creates ShippingItem objects based on extracted invoice items.
 * It first checks the database for existing items by SKU. If an item exists, its data is used.
 * If not, it estimates dimensions using AI and creates a new item in the database.
 * SKUs are normalized (trimmed and uppercased) for matching and storage.
 *
 * @param {ExtractedInvoiceItem[]} itemsFromInvoice - Array of items extracted from the invoice.
 * @returns {Promise<ShippingItem[]>} A promise that resolves to an array of ShippingItem objects.
 *                                    These items will have their `quantity` field set from the invoice.
 *                                    Items fetched from DB will retain their stored properties,
 *                                    while new items will have AI-estimated dimensions.
 */
export async function getOrCreateShippingItemsFromInvoice(
	itemsFromInvoice: ExtractedInvoiceItem[]
): Promise<ShippingItem[]> {
	if (!itemsFromInvoice || itemsFromInvoice.length === 0) {
		logger.info(
			"getOrCreateShippingItemsFromInvoice: No items from invoice to process."
		);
		return [];
	}

	// 1. Aggregate quantities for items with the same SKU from the invoice
	// SKUs are normalized (trimmed, uppercased) during aggregation.
	const aggregatedInvoiceItems = new Map<string, ExtractedInvoiceItem>();
	for (const item of itemsFromInvoice) {
		if (!item.sku || item.sku.trim() === "") {
			logger.warn(
				`[getOrCreateShippingItemsFromInvoice] Invoice item "${item.name}" missing SKU or SKU is empty, cannot process.`,
				item
			);
			continue;
		}
		const trimmedSku = item.sku.trim().toUpperCase();
		if (aggregatedInvoiceItems.has(trimmedSku)) {
			const existing = aggregatedInvoiceItems.get(trimmedSku)!;
			existing.quantity += item.quantity;
			// Retain name and weight from the first encountered item for that SKU in the invoice.
			// Weight might be refined later by AI or DB.
		} else {
			aggregatedInvoiceItems.set(trimmedSku, {
				...item,
				sku: trimmedSku,
				weight: item.weight,
			}); // Ensure weight is in kg
		}
	}
	logger.info(
		"[getOrCreateShippingItemsFromInvoice] Aggregated invoice items by SKU.",
		{ count: aggregatedInvoiceItems.size }
	);

	// 2. Fetch existing items from DB using DataService
	// DataService.shippingItems.getAvailable() should ideally allow filtering by SKUs for efficiency.
	// For now, fetching all and filtering locally.
	// Ensure SKUs in DB are also stored in a normalized way (uppercase).
	const dbResponse = await DataService.shippingItems.getAvailable(); // Gets all non-deleted items
	const existingDbItems: ShippingItem[] =
		dbResponse.success && dbResponse.data ? dbResponse.data : [];

	const dbItemsBySku = new Map<string, ShippingItem>();
	existingDbItems.forEach((dbItem) => {
		if (dbItem.sku) {
			dbItemsBySku.set(dbItem.sku.trim().toUpperCase(), dbItem);
		} else {
			logger.warn(
				"[getOrCreateShippingItemsFromInvoice] DB item found with missing SKU.",
				{ id: dbItem._id }
			);
		}
	});
	logger.info(
		"[getOrCreateShippingItemsFromInvoice] Fetched and mapped DB items by SKU.",
		{ count: dbItemsBySku.size }
	);

	const finalShippingItems: ShippingItem[] = [];
	const itemsToEstimate: ExtractedInvoiceItem[] = [];

	// 3. Process aggregated invoice items: check DB, collect items for AI estimation
	for (const invoiceItem of Array.from(aggregatedInvoiceItems.values())) {
		const normalizedSku = invoiceItem.sku; // Already normalized
		const dbItem = dbItemsBySku.get(normalizedSku);

		if (dbItem) {
			logger.info(
				`[getOrCreateShippingItemsFromInvoice] Item found in DB: ${normalizedSku}. Using DB data.`
			);
			logSuspiciousWeight(dbItem, "DB");
			finalShippingItems.push({
				...dbItem, // All properties from DB item (_id, name, sku, l,w,h, weight, timestamps)
				quantity: invoiceItem.quantity, // Update quantity from current invoice
			});
		} else {
			logger.info(
				`[getOrCreateShippingItemsFromInvoice] Item not in DB: ${normalizedSku}. Will estimate dimensions.`
			);
			// Ensure weight is in kg before sending to AI for dimension estimation
			itemsToEstimate.push({ ...invoiceItem, weight: invoiceItem.weight });
		}
	}

	// 4. Estimate dimensions for items not found in DB
	if (itemsToEstimate.length > 0) {
		logger.info(
			`[getOrCreateShippingItemsFromInvoice] Estimating dimensions for ${itemsToEstimate.length} new items.`
		);
		const estimatedItemsDetails: EstimatedItemWithDimensions[] =
			await estimateItemDimensionsAI(itemsToEstimate);

		for (const estimatedDetail of estimatedItemsDetails) {
			logSuspiciousWeight(estimatedDetail, "AI Estimation");

			const newItemDataForDb: Omit<
				ShippingItem,
				"_id" | "createdAt" | "updatedAt" | "deletedAt"
			> = {
				name: estimatedDetail.name,
				sku: estimatedDetail.sku,
				length: estimatedDetail.length,
				width: estimatedDetail.width,
				height: estimatedDetail.height,
				weight: estimatedDetail.weight,
				quantity: estimatedDetail.quantity, // Added quantity to satisfy ShippingItem type requirement
			};

			try {
				logger.info(
					`[getOrCreateShippingItemsFromInvoice] Adding new item to DB: ${newItemDataForDb.sku}`
				);
				const creationResponse = await DataService.shippingItems.add(
					newItemDataForDb
				);
				if (creationResponse.success && creationResponse.data) {
					logger.info(
						`[getOrCreateShippingItemsFromInvoice] Successfully added item ${creationResponse.data.sku} with id ${creationResponse.data._id}`
					);
					finalShippingItems.push({
						...creationResponse.data,
						quantity: itemsToEstimate.find(
							(item) => item.sku === estimatedDetail.sku
						)!.quantity, // Add invoice quantity
					});
				} else {
					logger.error(
						"[getOrCreateShippingItemsFromInvoice] Failed to add new item to DB.",
						{ sku: newItemDataForDb.sku, error: creationResponse.message }
					);
					// Fallback: use estimated data with a temporary ID if DB add fails, so frontend can still process
					const tempId = `temp_${Date.now()}_${newItemDataForDb.sku}`;
					finalShippingItems.push({
						_id: tempId,
						...newItemDataForDb,
						quantity: itemsToEstimate.find(
							(item) => item.sku === estimatedDetail.sku
						)!.quantity,
						createdAt: new Date(),
						updatedAt: new Date(),
						deletedAt: null,
					});
				}
			} catch (error: any) {
				logger.error(
					"[getOrCreateShippingItemsFromInvoice] Exception while adding new item to DB.",
					{ sku: newItemDataForDb.sku, error: error.message }
				);
				const tempId = `temp_exc_${Date.now()}_${newItemDataForDb.sku}`;
				finalShippingItems.push({
					_id: tempId,
					...newItemDataForDb,
					quantity: itemsToEstimate.find(
						(item) => item.sku === estimatedDetail.sku
					)!.quantity,
					createdAt: new Date(),
					updatedAt: new Date(),
					deletedAt: null,
				});
			}
		}
	}
	logger.info(
		"[getOrCreateShippingItemsFromInvoice] Finished processing all invoice items.",
		{ finalCount: finalShippingItems.length }
	);
	return finalShippingItems;
}

/**
 * Orchestrates the full invoice processing workflow.
 * 1. Extracts text from the provided file buffer.
 * 2. Extracts item details (name, SKU, quantity, weight) from the text using AI.
 * 3. For each extracted item, retrieves existing data from the database or
 *    estimates dimensions using AI and saves the new item to the database.
 *
 * @param {Buffer} fileBuffer - Buffer containing the invoice file content.
 * @param {string} fileType - MIME type of the file (e.g., "application/pdf", "text/plain").
 * @param {string} fileName - Original name of the file.
 * @returns {Promise<ShippingItem[]>} A promise resolving to an array of ShippingItem objects,
 *                                    augmented with the quantity from the current invoice.
 * @throws {Error} If any step of the processing pipeline fails.
 */
export async function processInvoiceFile(
	fileBuffer: Buffer,
	fileType: string,
	fileName: string
): Promise<ShippingItem[]> {
	logger.info(
		"processInvoiceFile: Starting full invoice processing workflow.",
		{ fileName, fileType }
	);

	// Step 1: Extract text from file
	let textContent: string;
	try {
		textContent = await extractTextFromFile(fileBuffer, fileType, fileName);
		logger.info("processInvoiceFile: Text extraction successful.", {
			fileName,
		});
	} catch (error: any) {
		logger.error("processInvoiceFile: Text extraction failed.", {
			fileName,
			error: error.message,
		});
		throw new Error(`Failed to extract text from invoice: ${error.message}`);
	}

	// Step 2: Extract structured item data from text using AI
	let extractedItems: ExtractedInvoiceItem[];
	try {
		extractedItems = await extractInvoiceItemsFromText(textContent);
		if (!Array.isArray(extractedItems) || extractedItems.length === 0) {
			logger.warn(
				"processInvoiceFile: No items found in invoice text or AI returned invalid format.",
				{ fileName }
			);
			throw new Error(
				"No items found in invoice (AI returned no items or invalid format)."
			);
		}
		logger.info(
			`processInvoiceFile: AI extracted ${extractedItems.length} items initially.`,
			{ fileName }
		);
	} catch (error: any) {
		logger.error("processInvoiceFile: AI item extraction failed.", {
			fileName,
			error: error.message,
		});
		throw new Error(`Failed to extract items using AI: ${error.message}`);
	}

	// Step 3: Get full ShippingItem objects (from DB or new via AI estimation + DB save)
	let finalShippingItems: ShippingItem[];
	try {
		finalShippingItems = await getOrCreateShippingItemsFromInvoice(
			extractedItems
		);
		logger.info(
			`processInvoiceFile: Successfully processed and retrieved/created ${finalShippingItems.length} shipping items.`,
			{ fileName }
		);
	} catch (error: any) {
		logger.error(
			"processInvoiceFile: Failed to get or create shipping items.",
			{ fileName, error: error.message }
		);
		throw new Error(`Failed to get or create shipping items: ${error.message}`);
	}

	return finalShippingItems;
}
