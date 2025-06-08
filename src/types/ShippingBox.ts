/**
 * Shipping Box Interface
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file defines the TypeScript interface for a ShippingBox, including its dimensions and properties.
 */

export default interface ShippingBox {
	_id: string;
	name: string;
	length: number;
	width: number;
	height: number;
	maxWeight: number;
}
