import { MongoDocument } from "./mongodb";

/**
 * ShippingItem Interface (migrated from sample code)
 * Updated: 2025-06-08
 * Author: Deej Potter (original), migrated by Daniel
 *
 * NOTE: This file was migrated from sample code/types/box-shipping-calculator/ShippingItem.ts
 * and adapted for backend use. Comments and logic have been preserved and improved.
 */

export default interface ShippingItem extends MongoDocument {
	/**
	 * The user-friendly name of the item.
	 * @example "V-Slot Extrusion 2020 - 1.5m"
	 */
	name: string;

	/**
	 * The Maker Store SKU of the item.
	 * @example "LR-2020-S-1500"
	 */
	sku: string;

	/**
	 * The length of the item in millimeters.
	 * @example 100
	 */
	length: number;

	/**
	 * The width of the item in millimeters.
	 * @example 20
	 */
	width: number;

	/**
	 * The height of the item in millimeters.
	 * @example 20
	 */
	height: number;

	/**
	 * The weight of the item in grams.
	 * @example 1500
	 */
	weight: number;

	/**
	 * The quantity of this item.
	 * @example 1
	 */
	quantity: number;
}
