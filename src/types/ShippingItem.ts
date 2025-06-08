/**
 * Shipping Item Interface
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file defines the TypeScript interface for a ShippingItem, detailing its properties and dimensions for packing.
 */

import { MongoDocument } from "./mongodb";

/**
 * ShippingItem Interface
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: Defines the structure for a single shipping item, including its properties and dimensions.
 * Inherits from MongoDocument for database compatibility.
 * Migrated from sample code and adapted for backend use.
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
