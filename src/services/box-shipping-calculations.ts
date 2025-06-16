/**
 * Box Shipping Calculation Service
 * Updated: 08/07/2025
 * Author: Deej Potter / GitHub Copilot
 * Description: This file contains the logic for calculating optimal box sizes for shipping items, including 3D bin packing algorithms.
 * Migrated from sample code/app/box-shipping-calculator/BoxCalculations.ts
 */

import ShippingItem from "../types/ShippingItem";
import ShippingBox from "../types/ShippingBox";
import {
	Point3D,
	PackedItem,
	PackingBox,
	MultiBoxPackingResult,
} from "../types/box-shipping-types"; // Updated import

// Constants for box preference calculation
const MAX_PREFERRED_LENGTH = 1200; // mm
const LENGTH_PENALTY_FACTOR = 1.5;
const EXTREME_LENGTH_THRESHOLD = 1500; // mm
const EXTREME_LENGTH_PENALTY_FACTOR = 10.0;
// const VOLUME_THRESHOLD = 30000000; // 30 million cubic mm (~30L) - Not currently used directly in selection logic, but good for context

/**
 * Standard box sizes available for shipping
 * These dimensions are in millimeters and weights in grams
 */
export const standardBoxes: ShippingBox[] = [
	{
		_id: "padded satchel",
		name: "Padded Satchel",
		length: 100,
		width: 80,
		height: 20,
		maxWeight: 300,
	},
	{
		_id: "small satchel",
		name: "Small Satchel",
		length: 240,
		width: 150,
		height: 100,
		maxWeight: 5000,
	},
	{
		_id: "small",
		name: "Small Box",
		length: 190,
		width: 150,
		height: 100,
		maxWeight: 25000,
	},
	{
		_id: "medium",
		name: "Medium Box",
		length: 290,
		width: 290,
		height: 190,
		maxWeight: 25000,
	},
	{
		_id: "bigger",
		name: "Bigger Box",
		length: 440,
		width: 340,
		height: 240,
		maxWeight: 25000,
	},
	{
		_id: "large",
		name: "Large Box",
		length: 500,
		width: 100,
		height: 100,
		maxWeight: 25000,
	},
	{
		_id: "extra large",
		name: "Extra Large Box",
		length: 1150,
		width: 100,
		height: 100,
		maxWeight: 25000,
	},
	{
		_id: "xxl",
		name: "XXL Box",
		length: 1570,
		width: 100,
		height: 100,
		maxWeight: 25000,
	},
	{
		_id: "3m box",
		name: "3m Box",
		length: 3050,
		width: 150,
		height: 150,
		maxWeight: 25000,
	},
];

/**
 * Get all possible orientations of an item
 */
function getItemOrientations(item: ShippingItem): Array<{
	width: number;
	height: number;
	depth: number;
}> {
	return [
		{ width: item.width, height: item.height, depth: item.length },
		{ width: item.length, height: item.height, depth: item.width },
		{ width: item.width, height: item.length, depth: item.height },
		{ width: item.height, height: item.width, depth: item.length },
		{ width: item.length, height: item.width, depth: item.height },
		{ width: item.height, height: item.length, depth: item.width },
	];
}

/**
 * Check if an item in a specific orientation fits at position in the box
 */
function itemFitsAtPosition(
	box: ShippingBox,
	position: Point3D,
	orientation: { width: number; height: number; depth: number },
	packedItems: PackedItem[]
): boolean {
	if (
		position.x + orientation.width > box.width ||
		position.y + orientation.height > box.height ||
		position.z + orientation.depth > box.length
	) {
		return false;
	}

	for (const packedItem of packedItems) {
		if (
			position.x < packedItem.position.x + packedItem.dimensions.width &&
			position.x + orientation.width > packedItem.position.x &&
			position.y < packedItem.position.y + packedItem.dimensions.height &&
			position.y + orientation.height > packedItem.position.y &&
			position.z < packedItem.position.z + packedItem.dimensions.depth &&
			position.z + orientation.depth > packedItem.position.z
		) {
			return false;
		}
	}
	return true;
}

/**
 * Generate new extreme points after adding an item
 */
function generateExtremePoints(
	packingBox: PackingBox,
	newItem: PackedItem
): Point3D[] {
	const { position, dimensions } = newItem;
	const newPoints: Point3D[] = [];

	newPoints.push({
		x: position.x,
		y: position.y + dimensions.height,
		z: position.z,
	});
	newPoints.push({
		x: position.x + dimensions.width,
		y: position.y,
		z: position.z,
	});
	newPoints.push({
		x: position.x,
		y: position.y,
		z: position.z + dimensions.depth,
	});

	const existingPoints = [...packingBox.extremePoints];
	for (const point of existingPoints) {
		if (
			point.x >= position.x &&
			point.x < position.x + dimensions.width &&
			point.y >= position.y &&
			point.y < position.y + dimensions.height &&
			point.z >= position.z &&
			point.z < position.z + dimensions.depth
		) {
			continue;
		}
		newPoints.push(point);
	}
	return filterAndSortPoints(newPoints);
}

/**
 * Filter duplicate extreme points and sort them
 */
function filterAndSortPoints(points: Point3D[]): Point3D[] {
	const uniquePoints = new Map<string, Point3D>();
	for (const point of points) {
		const key = `${point.x},${point.y},${point.z}`;
		uniquePoints.set(key, point);
	}
	return Array.from(uniquePoints.values()).sort((a, b) => {
		if (a.y !== b.y) return a.y - b.y;
		if (a.x !== b.x) return a.x - b.x;
		return a.z - b.z;
	});
}

/**
 * Try to pack an item into a specific box
 */
function packItemIntoBox(item: ShippingItem, packingBox: PackingBox): boolean {
	if (item.weight > packingBox.remainingWeight) {
		return false;
	}
	const orientations = getItemOrientations(item);

	for (const point of packingBox.extremePoints) {
		for (
			let rotationIndex = 0;
			rotationIndex < orientations.length;
			rotationIndex++
		) {
			const orientation = orientations[rotationIndex];
			if (
				itemFitsAtPosition(
					packingBox.box,
					point,
					orientation,
					packingBox.packedItems
				)
			) {
				const packedItem: PackedItem = {
					item,
					position: point,
					rotation: rotationIndex,
					dimensions: orientation,
				};
				packingBox.packedItems.push(packedItem);
				packingBox.remainingWeight -= item.weight;
				packingBox.extremePoints = generateExtremePoints(
					packingBox,
					packedItem
				);
				return true;
			}
		}
	}
	return false;
}

/**
 * Create a new packing box from a ShippingBox
 */
function createPackingBox(box: ShippingBox): PackingBox {
	return {
		box,
		packedItems: [],
		extremePoints: [{ x: 0, y: 0, z: 0 }],
		remainingWeight: box.maxWeight,
	};
}

/**
 * Calculate box preference score (lower is better)
 */
function calculateBoxPreference(
	box: ShippingBox,
	longestItemLength: number = 0
): number {
	const volume = box.length * box.width * box.height;
	if (
		box.length > EXTREME_LENGTH_THRESHOLD &&
		longestItemLength < EXTREME_LENGTH_THRESHOLD
	) {
		return (
			volume *
			Math.pow(
				box.length / EXTREME_LENGTH_THRESHOLD,
				EXTREME_LENGTH_PENALTY_FACTOR
			)
		);
	}
	const lengthPenalty =
		box.length > MAX_PREFERRED_LENGTH
			? Math.pow(box.length / MAX_PREFERRED_LENGTH, LENGTH_PENALTY_FACTOR)
			: 1;
	return volume * lengthPenalty;
}

/**
 * Calculates the best box size for a single set of items.
 */
export function findBestBox(itemsToPack: ShippingItem[]): {
	success: boolean;
	box: ShippingBox | null;
	packedItems: ShippingItem[];
	unfitItems: ShippingItem[];
} {
	if (itemsToPack.length === 0) {
		return {
			success: true,
			box: standardBoxes[0], // Default to smallest box for empty list
			packedItems: [],
			unfitItems: [],
		};
	}

	const expandedItems: ShippingItem[] = [];
	for (const item of itemsToPack) {
		// If you need to handle multiple quantities, repeat the item in the input array.
		expandedItems.push(item);
	}

	let longestItemDimension = 0;
	for (const item of expandedItems) {
		longestItemDimension = Math.max(
			longestItemDimension,
			item.length,
			item.width,
			item.height
		);
	}

	const sortedBoxes = [...standardBoxes].sort((a, b) => {
		return (
			calculateBoxPreference(a, longestItemDimension) -
			calculateBoxPreference(b, longestItemDimension)
		);
	});

	for (const box of sortedBoxes) {
		const packingBox = createPackingBox(box);
		let allFit = true;
		for (const item of expandedItems) {
			if (!packItemIntoBox(item, packingBox)) {
				allFit = false;
				break;
			}
		}
		if (allFit) {
			const groupedItems = groupPackedItemsByOriginal(
				packingBox.packedItems,
				itemsToPack
			);
			return {
				success: true,
				box,
				packedItems: groupedItems,
				unfitItems: [],
			};
		}
	}

	return {
		success: false,
		box: null,
		packedItems: [],
		unfitItems: itemsToPack, // Return original items if no box fits
	};
}

/**
 * Group packed items back to their original form with proper quantities
 */
function groupPackedItemsByOriginal(
	packedItems: PackedItem[],
	originalItems: ShippingItem[]
): ShippingItem[] {
	// Since ShippingItem no longer has quantity, just return the packed items as-is.
	return packedItems.map((p) => p.item);
}

/**
 * Check if a set of items has similar dimensions
 */
/* // This function seems to be unused in the provided multi-box packing logic, 
   // but retained for now in case it's needed or was part of a different strategy.
function itemsAreUniform(items: ShippingItem[]): boolean {
	let lengthsArray: number[] = [];
	items.forEach((item) => {
		const qty = item.quantity || 1;
		for (let i = 0; i < qty; i++) {
			lengthsArray.push(item.length);
		}
	});

	const maxItemLength = Math.max(...items.map((item) => item.length));

	return (
		lengthsArray.length > 0 &&
		new Set(lengthsArray).size <= 3 && 
		maxItemLength <= MAX_PREFERRED_LENGTH
	); 
}
*/

/**
 * Pack items into multiple boxes using the Extreme Point-based 3D bin packing algorithm
 */
export function packItemsIntoMultipleBoxes(
	itemsToPack: ShippingItem[]
): MultiBoxPackingResult {
	if (itemsToPack.length === 0) {
		return {
			success: true,
			shipments: [],
			unfitItems: [],
		};
	}

	// console.log("[BoxCalc] Starting Extreme Point-based packing algorithm"); // Optional: for debugging
	console.log(
		`[BoxCalc] packItemsIntoMultipleBoxes called. itemsToPack:`,
		itemsToPack
	);

	// Attempt to pack all items into a single box first.
	// This is often the most cost-effective and simplest solution.
	const singleBoxResult = findBestBox([...itemsToPack]); // Use a copy for safety
	if (singleBoxResult.success && singleBoxResult.box) {
		// Determine if an extremely long box was chosen and if it was necessary
		let longestItemDim = 0;
		for (const item of itemsToPack) {
			longestItemDim = Math.max(
				longestItemDim,
				item.length,
				item.width,
				item.height
			);
		}
		const needsLongBox = longestItemDim >= EXTREME_LENGTH_THRESHOLD;

		// If a standard box was found, or an extreme box was needed and found, use it.
		if (singleBoxResult.box.length < EXTREME_LENGTH_THRESHOLD || needsLongBox) {
			return {
				success: true,
				shipments: [
					{
						box: singleBoxResult.box,
						packedItems: singleBoxResult.packedItems,
					},
				],
				unfitItems: [],
			};
		}
		// If an extremely long box was chosen but not strictly necessary,
		// proceed to multi-box to see if a better (less penalized) combination exists.
	}

	const expandedItems: ShippingItem[] = [];
	for (const item of itemsToPack) {
		// If you need to handle multiple quantities, repeat the item in the input array.
		expandedItems.push(item);
	}

	expandedItems.sort((a, b) => {
		const volA = a.length * a.width * a.height;
		const volB = b.length * b.width * b.height;
		return volB - volA; // Largest volume first
	});

	// console.log(`[BoxCalc] Processing ${expandedItems.length} individual items for multi-box`); // Optional

	const packingBoxes: PackingBox[] = [];
	const currentUnfitItems: ShippingItem[] = [];

	let longestItemDimension = 0;
	for (const item of expandedItems) {
		longestItemDimension = Math.max(
			longestItemDimension,
			item.length,
			item.width,
			item.height
		);
	}

	const sortedStandardBoxes = [...standardBoxes].sort((a, b) => {
		return (
			calculateBoxPreference(a, longestItemDimension) -
			calculateBoxPreference(b, longestItemDimension)
		);
	});

	for (const item of expandedItems) {
		let packed = false;
		for (const pBox of packingBoxes) {
			if (packItemIntoBox(item, pBox)) {
				packed = true;
				break;
			}
		}

		if (!packed) {
			for (const boxTemplate of sortedStandardBoxes) {
				const newPackingBox = createPackingBox(boxTemplate);
				if (packItemIntoBox(item, newPackingBox)) {
					packingBoxes.push(newPackingBox);
					packed = true;
					break;
				}
			}
		}

		if (!packed) {
			currentUnfitItems.push(item);
		}
	}

	const shipments = packingBoxes.map((pBox) => {
		const groupedPackedItems = groupPackedItemsByOriginal(
			pBox.packedItems,
			itemsToPack // Group against the original list to restore original quantities
		);
		return {
			box: pBox.box,
			packedItems: groupedPackedItems,
		};
	});

	// Group unfit items based on the original items list
	const groupedUnfitItems = groupPackedItemsByOriginal(
		currentUnfitItems.map((item) => ({
			// Convert ShippingItem[] to PackedItem[] for grouping
			item,
			position: { x: 0, y: 0, z: 0 }, // Dummy data, not used by grouping logic
			rotation: 0,
			dimensions: {
				width: item.width,
				height: item.height,
				depth: item.length,
			}, // Dummy
		})),
		itemsToPack
	);

	return {
		success: groupedUnfitItems.length === 0,
		shipments,
		unfitItems: groupedUnfitItems,
	};
}
