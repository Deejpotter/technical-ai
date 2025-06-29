/**
 * Shipping Item Interface
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file defines the TypeScript interface for a ShippingItem, detailing its properties and dimensions for packing.
 */

import { MongoDocument } from "./mongodb";

/**
 * @description Represents a shipping item in the Maker Store.
 * @extends MongoDocument
 * @property {string} name - The user-friendly name of the item.
 * @property {string} sku - The Maker Store SKU of the item, used for inventory management.
 * @property {number} length - The length of the item in millimeters.
 * @property {number} width - The width of the item in millimeters.
 * @property {number} height - The height of the item in millimeters.
 * @property {number} weight - The weight of the item in grams.
 * @example
 * const shippingItem: ShippingItem = {
 * 	_id: "60c72b2f9b1e8b001c8e4d3a",
 * 	name: "V-Slot Extrusion 2020 - 1.5m",
 * 	sku: "LR-2020-S-1500",
 * 	length: 1500,
 * 	width: 20,
 * 	height: 20,
 * 	weight: 500
 */
export default interface ShippingItem extends MongoDocument {
	/**
	 * The user-friendly name of the item.
	 * @example "V-Slot Extrusion 2020 - 1.5m"
	 */
	name: string;

	/**
	 * The Maker Store SKU of the item. This is the unique identifier used for inventory management.
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
}
