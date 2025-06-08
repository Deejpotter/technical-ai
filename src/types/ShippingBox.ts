/**
 * ShippingBox Interface (migrated from sample code)
 * Updated: 2025-06-08
 * Author: Deej Potter (original), migrated by Daniel
 *
 * NOTE: This file was migrated from sample code/types/box-shipping-calculator/ShippingBox.ts
 * and adapted for backend use. Comments and logic have been preserved and improved.
 */

export default interface ShippingBox {
	_id: string;
	name: string;
	length: number;
	width: number;
	height: number;
	maxWeight: number;
}
