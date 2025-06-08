/**
 * Shipping Item List Interface
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file defines the TypeScript interface for a list of shipping items, used in packing and calculation contexts.
 */

import ShippingItem from "./ShippingItem";

/**
 * ShippingItemList Interface
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: Defines the structure for a list of shipping items, typically used for packing calculations.
 * Migrated from sample code and adapted for backend use.
 */

export default interface ShippingItemList {
	/**
	 * Array of ShippingItem objects representing the items to be packed.
	 */
	items: ShippingItem[];
}
