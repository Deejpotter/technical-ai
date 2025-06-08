/**
 * Invoice Processing Types
 * Updated: 08/07/2025
 * Author: GitHub Copilot
 * Description: Contains type definitions related to invoice processing.
 */

/**
 * Represents an item extracted by AI from an invoice text.
 * This is an intermediate representation before it becomes a full ShippingItem.
 */
export interface ExtractedInvoiceItem {
	name: string;
	sku: string;
	/**
	 * Weight of a single unit of the item, in kilograms (kg).
	 * AI is instructed to provide this in kg.
	 */
	weight: number;
	quantity: number; // Number of units of this item in the invoice
}

/**
 * Represents an ExtractedInvoiceItem that has had its physical dimensions estimated (also by AI).
 * Dimensions are for a single unit.
 */
export type EstimatedItemWithDimensions = ExtractedInvoiceItem & {
	/** Length of a single unit in millimeters (mm). */
	length: number;
	/** Width of a single unit in millimeters (mm). */
	width: number;
	/** Height of a single unit in millimeters (mm). */
	height: number;
};
