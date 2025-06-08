/**
 * ShippingItemList
 * Updated: 05/13/2025
 * Author: Deej Potter
 * Description: Defines the structure for managing collections of shipping items.
 * Used for tracking items that need to be packed into shipping boxes.
 */

import ShippingItem from "./ShippingItem";

/**
 * Represents a list of ShippingItems that need to be packed into one or more boxes.
 * @example
 * const shippingItemList: ShippingItemList = {
 *  items: [
 * 	{
 * 		id: "507f1f77bcf86cd799439011",
 * 		name: "V-Slot Extrusion 2020 - 1.5m",
 * 		sku: "LR-2020-S-1500",
 * 		length: 1500,
 * 		width: 20,
 * 		height: 20,
 * 		weight: 1500,
 * 		deletedAt: null,
 * 		updatedAt: "2023-10-01T12:00:00Z",
 * 		quantity: 1,
 * 	},
 * 	{
 * 		id: "507f1f77bcf86cd799439012",
 * 		name: "V-Slot Extrusion 2040 - 1.5m",
 * 		sku: "LR-2040-S-1500",
 * 		length: 100,
 * 		width: 50,
 * 		height: 25,
 * 		weight: 1500,
 * 		deletedAt: null,
 * 		updatedAt: "2023-10-01T12:00:00Z",
 * 		quantity: 1,
 * 	],
 * };
 */
export default interface ShippingItemList {
	/**
	 * Array of ShippingItem objects representing the items to be packed.
	 * @example
	 * [
	 * ]
	 */
	items: ShippingItem[];
}
