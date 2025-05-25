/**
 * Process Invoices server actions
 * Updated: 23/05/25
 * Author: Deej Potter
 * Description: Handles invoice processing, including PDF extraction and AI item extraction.
 * Uses Next.js 14 server actions, pdf-parse, and OpenAI API for item extraction.
 */

"use server";

import { OpenAI } from "openai";
import pdfParse from "pdf-parse";
import ShippingItem from "@/interfaces/box-shipping-calculator/ShippingItem";
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
 * Process invoice file and extract items using AI
 * @param formData Form data containing the invoice file
 * @returns Array of shipping items with dimensions
 */
export async function processInvoice(
	formData: FormData
): Promise<ShippingItem[]> {
	try {
		const file = formData.get("invoice") as File;
		if (!file) {
			throw new Error("No file provided");
		}

		// First try PDF extraction
		const buffer = await file.arrayBuffer();
		const pdfText = await extractPdfText(buffer);

		let textContent: string;

		if (pdfText) {
			console.log("PDF Content:", pdfText);
			textContent = pdfText;
		} else {
			textContent = await file.text();
			console.log("Raw Text Content:", textContent);
		}

		// Process with AI to extract items
		const extractedItems = await processWithAI(textContent);
		if (!extractedItems?.length) {
			throw new Error("No items found in invoice");
		}

		// Get full ShippingItem objects, either from DB or by creating new ones
		const shippingItemsFromInvoice = await getItemDimensions(extractedItems);
		console.log(
			"Shipping items from invoice processing:",
			shippingItemsFromInvoice
		);

		// The result from getItemDimensions is already Promise<ShippingItem[]>
		return shippingItemsFromInvoice;
	} catch (error) {
		console.error("Invoice processing error:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to process invoice"
		);
	}
}

/**
 * Extract text content from PDF using pdf-parse
 * @param buffer PDF file buffer
 * @returns Extracted text content
 */
async function extractPdfText(buffer: ArrayBuffer): Promise<string | null> {
	try {
		// Convert ArrayBuffer to Buffer for pdf-parse
		const data = Buffer.from(buffer);
		const result = await pdfParse(data);

		// Return the text content from the PDF
		return result.text.trim() || null;
	} catch (error) {
		console.error("PDF extraction error:", error);
		return null;
	}
}

/**
 * Process text content with OpenAI to extract item details
 */
async function processWithAI(text: string): Promise<ExtractedItem[]> {
	try {
		// gpt-4o-mini is the recommended model for basic tasks now.
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"Extract item details from invoice text. Return only the structured data.",
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
                        Estimate dimensions for hardware items in millimeters.
                        Consider:
                        - Standard hardware sizes
                        - Packaging for multi-packs
                        - Common engineering dimensions
                        - Item descriptions and SKUs
                        Return conservative estimates that would fit the items.
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
		console.error("Dimension estimation error:", error); // Fallback to default dimensions if estimation fails
		return items.map((item) => ({
			...item,
			length: 50,
			width: 50,
			height: 50,
			weight: item.weight || 1,
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
	const dbItemsBySku = new Map(
		existingDbItems.map((item) => [item.sku.trim().toUpperCase(), item]) // Standardize SKU to uppercase for lookup
	);

	const finalShippingItems: ShippingItem[] = [];

	// 3. Process aggregated invoice items
	// Convert Map iterator to an array to avoid downlevelIteration issues
	for (const invoiceItem of Array.from(aggregatedInvoiceItems.values())) {
		const dbItem = dbItemsBySku.get(invoiceItem.sku); // SKU is already trimmed and uppercased
		if (dbItem) {
			console.log(
				`SKU ${invoiceItem.sku} found in database. Using existing data for item: ${dbItem.name}`
			);

			// Note: The database already stores weights in grams as per BoxCalculations.ts,
			// so no conversion needed here
			finalShippingItems.push({
				...dbItem, // Includes _id, name, length, width, height, sku, createdAt, updatedAt, deletedAt from DB
				quantity: invoiceItem.quantity, // Aggregated quantity from the current invoice
				weight: dbItem.weight, // Prioritize DB weight over invoice extracted weight
			});
		} else {
			console.log(
				`SKU ${invoiceItem.sku} not found in database. Estimating dimensions for: ${invoiceItem.name}`
			);
			const [estimatedItemDetails] = await estimateItemDimensions([
				invoiceItem,
			]);

			if (!estimatedItemDetails) {
				console.error(
					`Failed to estimate dimensions for SKU: ${invoiceItem.sku}. Skipping item.`
				);
				continue;
			}
			// Ensure all dimensions and weight are valid numbers with fallback values
			const length =
				typeof estimatedItemDetails.length === "number" &&
				!isNaN(estimatedItemDetails.length)
					? estimatedItemDetails.length
					: 50;
			const width =
				typeof estimatedItemDetails.width === "number" &&
				!isNaN(estimatedItemDetails.width)
					? estimatedItemDetails.width
					: 50;
			const height =
				typeof estimatedItemDetails.height === "number" &&
				!isNaN(estimatedItemDetails.height)
					? estimatedItemDetails.height
					: 50;

			// Convert weight from kg to grams (OpenAI returns weights in kg because of the invoice, but box calculations use grams)
			const weightInKg =
				typeof estimatedItemDetails.weight === "number" &&
				!isNaN(estimatedItemDetails.weight)
					? estimatedItemDetails.weight
					: 0.1;
			const weight = weightInKg * 1000; // Convert from kg to g

			// Prepare item data for database storage
			const newItemDataForDb: Omit<
				ShippingItem,
				"_id" | "createdAt" | "updatedAt" | "deletedAt"
			> & { deletedAt: null | Date } = {
				name: estimatedItemDetails.name,
				sku: estimatedItemDetails.sku.trim().toUpperCase(),
				length,
				width,
				height,
				weight, // Use shorthand property names
				deletedAt: null,
			};

			try {
				const creationResponse = await addItemToDatabase(
					newItemDataForDb as Omit<ShippingItem, "_id">
				);

				if (creationResponse.success && creationResponse.data) {
					const newlyAddedItem = creationResponse.data;
					console.log(
						`New item ${newlyAddedItem.name} (SKU: ${newlyAddedItem.sku}) added to database with ID: ${newlyAddedItem._id}`
					);
					finalShippingItems.push({
						...newlyAddedItem,
						quantity: invoiceItem.quantity,
					});
				} else {
					console.error(
						`Failed to add new item SKU ${invoiceItem.sku} to database: ${creationResponse.error}. Using temporary item.`
					);
					const tempId = `temp_${Date.now()}_${invoiceItem.sku}`;
					finalShippingItems.push({
						_id: tempId,
						...newItemDataForDb, // Use the already validated data
						quantity: invoiceItem.quantity || 1,
						createdAt: new Date(),
						updatedAt: new Date(),
						// deletedAt is already included in newItemDataForDb
					});
				}
			} catch (error) {
				console.error(
					`Exception while adding new item SKU ${invoiceItem.sku} to database:`,
					error
				);
				const tempId = `temp_exc_${Date.now()}_${invoiceItem.sku}`;
				finalShippingItems.push({
					_id: tempId,
					...newItemDataForDb, // Use the already validated data
					quantity: invoiceItem.quantity || 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					// deletedAt is already included in newItemDataForDb
				});
			}
		}
	}
	return finalShippingItems;
}

/**
 * Process invoice text and extract items using AI
 * @param invoiceText The extracted text content from the invoice PDF
 * @returns Array of shipping items with dimensions
 *
 * NOTE: The client is now responsible for extracting PDF text using pdfjs-dist (pdf.js).
 */
export async function processInvoiceText(
	invoiceText: string
): Promise<ShippingItem[]> {
	try {
		if (!invoiceText || typeof invoiceText !== "string") {
			throw new Error("No invoice text provided");
		}

		// Process with AI to extract items
		const extractedItems = await processWithAI(invoiceText);
		if (!extractedItems?.length) {
			throw new Error("No items found in invoice");
		}

		// Get full ShippingItem objects, either from DB or by creating new ones
		const shippingItemsFromInvoice = await getItemDimensions(extractedItems);
		console.log(
			"Shipping items from invoice processing:",
			shippingItemsFromInvoice
		);

		return shippingItemsFromInvoice;
	} catch (error) {
		console.error("Invoice processing error:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to process invoice"
		);
	}
}
