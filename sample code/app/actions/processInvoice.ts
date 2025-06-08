/**
 * Process Invoices server actions
 * Updated: 02/06/2025
 * Author: Deej Potter
 * Description: Handles invoice processing, including PDF extraction using pdf-ts and AI item extraction.
 * Uses Next.js 14 server actions and OpenAI API for item extraction.
 * Enhanced to support both PDF and text file imports using pdf-ts library.
 */

"use server";

import { OpenAI } from "openai";
import { pdfToText } from "pdf-ts"; // Import pdf-ts for PDF text extraction
import ShippingItem from "@/types/box-shipping-calculator/ShippingItem";
import {
	addItemToDatabase,
	updateItemInDatabase,
	getAllDocuments,
} from "./mongodb/actions";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Type definition for AI extracted item
 */
export interface ExtractedItem {
	name: string;
	sku: string;
	weight: number;
	quantity: number;
}

/**
 * Step 1: Extract text from invoice file (PDF or text)
 * This server action runs quickly and returns the extracted text.
 * @param formData Form data containing the invoice file (PDF or text)
 * @returns Extracted text content
 */
export async function extractInvoiceText(formData: FormData): Promise<string> {
	const file = formData.get("invoice") as File;
	if (!file) {
		throw new Error("No file provided");
	}
	let textContent: string;
	if (
		file.type === "application/pdf" ||
		file.name.toLowerCase().endsWith(".pdf")
	) {
		// PDF extraction
		const arrayBuffer = await file.arrayBuffer();
		if (!arrayBuffer) throw new Error("Failed to read PDF file as ArrayBuffer");
		const uint8Array = new Uint8Array(arrayBuffer);
		textContent = await pdfToText(uint8Array);
		if (!textContent)
			throw new Error("pdfToText returned empty or undefined text");
	} else {
		// Text file extraction
		textContent = await file.text();
		if (!textContent) throw new Error("Text file is empty or unreadable");
	}
	if (typeof textContent !== "string")
		throw new Error("Extracted file content is not a string");
	if (!textContent.trim())
		throw new Error("File appears to be empty or unreadable");
	return textContent;
}

/**
 * Step 2: Extract item details from invoice text using AI
 * This server action runs quickly for small/medium text, but should be chunked for large text.
 * @param text Extracted invoice text
 * @returns Array of extracted items
 */
export async function extractInvoiceItems(
	text: string
): Promise<ExtractedItem[]> {
	return await processWithAI(text);
}

/**
 * Process text content with OpenAI to extract item details
 * Enhanced to work with text extracted from both PDF and text files
 */
async function processWithAI(text: string): Promise<ExtractedItem[]> {
	try {
		// gpt-4o-mini is the recommended model for basic tasks now.
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

						I want the SKU.
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
											description: "Weight in kg",
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

		// Get the function call from the response.
		const functionCall = response.choices[0].message.function_call;
		if (!functionCall?.arguments) {
			throw new Error("No function call arguments received");
		}

		// Return the parsed items from the function call arguments.
		return JSON.parse(functionCall.arguments).items;
	} catch (error: any) {
		if (
			error?.error?.type === "invalid_request_error" &&
			error?.error?.code === "context_length_exceeded"
		) {
			throw new Error(
				"Invoice text is too long. Please try with a shorter invoice."
			);
		}
		throw new Error("Failed to process invoice with AI");
	}
}

/**
 * Process text content with OpenAI to estimate item dimensions
 * @param items Array of extracted items to estimate dimensions for
 * @returns Array of items with estimated dimensions
 */
async function estimateItemDimensions(
	items: ExtractedItem[]
): Promise<
	Array<ExtractedItem & { length: number; width: number; height: number }>
> {
	try {
		// gpt-4o-mini is the recommended model for basic tasks now.
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: `
                        Estimate dimensions for hardware items in millimeters and weights in grams.
                        Consider:
                        - Standard hardware sizes
                        - Packaging for multi-packs
                        - Common engineering dimensions
                        - Item descriptions and SKUs
                        Return conservative estimates that would fit the items.
												
												Here are some weights per mm for common extrusion profiles:
												- 20 x 20mm - 20 Series: 0.49g/mm
												- 20 x 40mm - 20 Series: 0.8g/mm
												- 20 x 60mm - 20 Series: 1.08g/mm
												- 20 x 80mm - 20 Series: 1.56g/mm
												- 40 x 40mm - 20 Series: 1.08g/mm
												- C-beam - 20 Series: 2.065g/mm
												- C-beam HEAVY - 20 Series: 3.31g/mm
												- 40 x 40mm - 40 Series: 1.57g/mm
												- 40 x 80mm - 40 Series: 2.86g/mm
                    `,
				},
				{
					role: "user",
					content: JSON.stringify(items),
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
											description: "Length in millimeters",
										},
										width: {
											type: "number",
											description: "Width in millimeters",
										},
										height: {
											type: "number",
											description: "Height in millimeters",
										},
										weight: { type: "number" },
										quantity: { type: "integer" },
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
			temperature: 0.1, // Keep low for consistent estimates
		});

		const functionCall = response.choices[0].message.function_call;
		if (!functionCall?.arguments) {
			throw new Error("No dimension estimates received");
		}

		return JSON.parse(functionCall.arguments).items;
	} catch (error) {
		console.error("Dimension estimation error:", error);
		// Fallback to default dimensions if estimation fails
		return items.map((item) => ({
			...item,
			length: 50,
			width: 50,
			height: 50,
		}));
	}
}

/**
 * Get dimensions for items, using database first then falling back to AI
 * @param items Array of extracted items
 * @returns Array of items with dimensions, with duplicates removed
 */
async function getItemDimensions(
	itemsFromInvoice: ExtractedItem[]
): Promise<ShippingItem[]> {
	// 1. Aggregate quantities for items with the same SKU from the invoice
	const aggregatedInvoiceItems = new Map<string, ExtractedItem>();
	for (const item of itemsFromInvoice) {
		if (!item.sku || item.sku.trim() === "") {
			console.warn(
				`Invoice item "${item.name}" missing SKU or SKU is empty, cannot process.`
			);
			continue;
		}
		const trimmedSku = item.sku.trim().toUpperCase(); // Standardize SKU to uppercase
		if (aggregatedInvoiceItems.has(trimmedSku)) {
			const existing = aggregatedInvoiceItems.get(trimmedSku)!;
			existing.quantity += item.quantity;
			// Retain the name and weight from the first encountered item for that SKU in the invoice.
		} else {
			// Store with trimmed, uppercase SKU
			aggregatedInvoiceItems.set(trimmedSku, { ...item, sku: trimmedSku });
		}
	}

	// 2. Fetch existing items from DB
	const dbResponse = await getAllDocuments<ShippingItem>("Items");
	const existingDbItems =
		dbResponse.success && dbResponse.data ? dbResponse.data : [];
	// --- SKU normalization and DB lookup must be consistent ---
	// Always normalize SKUs (trim and uppercase) for both DB and invoice items before matching.
	// This prevents accidental duplicate estimation and DB pollution.
	const dbItemsBySku = new Map(
		existingDbItems.map((item) => [item.sku.trim().toUpperCase(), item])
	);

	const finalShippingItems: ShippingItem[] = [];

	// Diagnostic: Log all normalized SKUs from DB and invoice before matching
	const dbSkus = Array.from(dbItemsBySku.keys());
	const invoiceSkus = Array.from(aggregatedInvoiceItems.values()).map((item) =>
		item.sku.trim().toUpperCase()
	);
	console.debug("[getItemDimensions] DB SKUs:", dbSkus);
	console.debug("[getItemDimensions] Invoice SKUs:", invoiceSkus);

	// 3. Process aggregated invoice items
	// Convert Map iterator to an array to avoid downlevelIteration issues
	for (const invoiceItemRaw of Array.from(aggregatedInvoiceItems.values())) {
		// Always normalize SKU for lookup and estimation
		const normalizedSku = invoiceItemRaw.sku.trim().toUpperCase();
		const dbItem = dbItemsBySku.get(normalizedSku);
		const invoiceItem = { ...invoiceItemRaw, sku: normalizedSku };

		if (dbItem) {
			// If the item already exists in the DB, always use the DB record and never add a duplicate.
			finalShippingItems.push({
				...dbItem, // Includes _id, name, length, width, height, sku, createdAt, updatedAt, deletedAt from DB
				quantity: invoiceItem.quantity, // Aggregated quantity from the current invoice
				weight: dbItem.weight, // Always trust DB weight
			});
			continue; // Skip adding a new item to the DB
		}

		// If the item does not exist in the DB, estimate dimensions and add it
		const [estimatedItemDetails] = await estimateItemDimensions([invoiceItem]);

		if (!estimatedItemDetails) {
			continue; // Skip if estimation fails
		}

		// Validate estimated weight: clamp to 100g for small hardware if suspiciously high
		let safeWeight = estimatedItemDetails.weight;
		if (
			safeWeight > 1000 &&
			!/extrusion|beam|motor|psu|power|controller|vfd|spindle|linear|lead|box|enclosure/i.test(
				estimatedItemDetails.name
			)
		) {
			// For small hardware, clamp to 100g max
			safeWeight = 100;
		}

		const newItemDataForDb = {
			name: estimatedItemDetails.name,
			sku: estimatedItemDetails.sku.trim().toUpperCase(),
			length: estimatedItemDetails.length,
			width: estimatedItemDetails.width,
			height: estimatedItemDetails.height,
			weight: safeWeight,
			deletedAt: null,
		};

		try {
			const creationResponse = await addItemToDatabase(
				newItemDataForDb as Omit<ShippingItem, "_id">
			);

			if (creationResponse.success && creationResponse.data) {
				finalShippingItems.push({
					...creationResponse.data,
					quantity: invoiceItem.quantity,
				});
			} else {
				const tempId = `temp_${Date.now()}_${invoiceItem.sku}`;
				finalShippingItems.push({
					_id: tempId,
					name: newItemDataForDb.name,
					sku: newItemDataForDb.sku,
					length: newItemDataForDb.length,
					width: newItemDataForDb.width,
					height: newItemDataForDb.height,
					weight: newItemDataForDb.weight,
					quantity: invoiceItem.quantity,
					createdAt: new Date(),
					updatedAt: new Date(),
					deletedAt: null,
				});
			}
		} catch (error) {
			const tempId = `temp_exc_${Date.now()}_${invoiceItem.sku}`;
			finalShippingItems.push({
				_id: tempId,
				name: newItemDataForDb.name,
				sku: newItemDataForDb.sku,
				length: newItemDataForDb.length,
				width: newItemDataForDb.width,
				height: newItemDataForDb.height,
				weight: newItemDataForDb.weight,
				quantity: invoiceItem.quantity,
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			});
		}
	}
	return finalShippingItems;
}

// Export getItemDimensions as a server action for client use
export async function getItemDimensionsServer(
	itemsFromInvoice: ExtractedItem[]
): Promise<ShippingItem[]> {
	return await getItemDimensions(itemsFromInvoice);
}

/**
 * @deprecated Use the chunked workflow: extractInvoiceText -> extractInvoiceItems -> getItemDimensionsServer
 * This monolithic orchestrator is kept for legacy/fallback only.
 */
export async function processInvoice(
	formData: FormData
): Promise<ShippingItem[]> {
	try {
		// Step 1: Extract text from file
		const textContent = await extractInvoiceText(formData);

		// Step 2: Extract items from text (for large text, client should chunk and call extractInvoiceItems in pieces)
		let extractedItems: ExtractedItem[] = [];
		try {
			extractedItems = await extractInvoiceItems(textContent);
		} catch (aiErr) {
			throw new Error(
				"Failed to extract items from invoice text. AI error: " +
					(aiErr instanceof Error ? aiErr.message : JSON.stringify(aiErr))
			);
		}
		if (!Array.isArray(extractedItems) || extractedItems.length === 0) {
			throw new Error(
				"No items found in invoice (AI returned no items or invalid format)"
			);
		}

		// Step 3: Get full ShippingItem objects, either from DB or by creating new ones
		let shippingItemsFromInvoice: ShippingItem[] = [];
		try {
			shippingItemsFromInvoice = await getItemDimensions(extractedItems);
		} catch (dimErr) {
			throw new Error(
				"Failed to get item dimensions: " +
					(dimErr instanceof Error ? dimErr.message : JSON.stringify(dimErr))
			);
		}
		return shippingItemsFromInvoice;
	} catch (error) {
		throw new Error(
			(error instanceof Error ? error.message : JSON.stringify(error)) +
				"\nIf this is a 502 Bad Gateway or TypeError, check server logs for more details."
		);
	}
}

// Defensive helper: Check for suspicious weights and log source
function logSuspiciousWeight(item, source) {
	if (
		item.weight > 1000 &&
		!/extrusion|beam|motor|psu|power|controller|vfd|spindle|linear|lead|box|enclosure/i.test(
			item.name
		)
	) {
		console.warn(
			`[processInvoice] Suspiciously high weight (${item.weight}g) for item '${item.name}' (SKU: ${item.sku}) from ${source}.`,
			item
		);
	}
}
