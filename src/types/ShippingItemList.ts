import ShippingItem from "./ShippingItem";

/**
 * ShippingItemList Interface (migrated from sample code)
 * Updated: 2025-06-08
 * Author: Deej Potter (original), migrated by Daniel
 *
 * NOTE: This file was migrated from sample code/types/box-shipping-calculator/ShippingItemList.ts
 * and adapted for backend use. Comments and logic have been preserved and improved.
 */

export default interface ShippingItemList {
	/**
	 * Array of ShippingItem objects representing the items to be packed.
	 */
	items: ShippingItem[];
}
