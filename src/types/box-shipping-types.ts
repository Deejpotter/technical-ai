/**
 * Box Shipping Types
 * Updated: 08/07/2025
 * Author: Deej Potter / GitHub Copilot
 * Description: This file defines TypeScript interfaces and types related to box shipping calculations and entities.
 * Migrated from sample code/types/box-shipping-calculator/box-shipping-types.ts and services/box-shipping-calculations.ts
 */

import ShippingBox from "./ShippingBox";
import ShippingItem from "./ShippingItem";

/**
 * Represents a 3D point in space, used for positioning items within a box.
 */
export interface Point3D {
	x: number;
	y: number;
	z: number;
}

/**
 * Represents an item that has been packed into a box, including its position and orientation.
 */
export interface PackedItem {
	/** The original shipping item. */
	item: ShippingItem;
	/** The position (bottom-left-back corner) of the item within the box. */
	position: Point3D;
	/** An index (0-5) representing one of the six possible orientations of the item. */
	rotation: number;
	/** The dimensions (width, height, depth) of the item after rotation. */
	dimensions: {
		width: number;
		height: number;
		depth: number;
	};
}

/**
 * Represents a shipping box during the packing process, including its contents and available space.
 */
export interface PackingBox {
	/** The shipping box being used. */
	box: ShippingBox;
	/** An array of items packed into the box, with their positions and orientations. */
	packedItems: PackedItem[];
	/** An array of possible positions (extreme points) where new items could be placed. */
	extremePoints: Point3D[];
	/** The remaining weight capacity of the box in grams. */
	remainingWeight: number;
}

/**
 * Defines the structure for the result of a multi-box packing attempt.
 */
export interface MultiBoxPackingResult {
	/** Indicates whether all items were successfully packed. */
	success: boolean;
	/** An array of shipments, where each shipment consists of a box and the items packed within it. */
	shipments: Array<{
		box: ShippingBox;
		packedItems: ShippingItem[];
	}>;
	/** An array of items that could not be fit into any box. */
	unfitItems: ShippingItem[];
}
