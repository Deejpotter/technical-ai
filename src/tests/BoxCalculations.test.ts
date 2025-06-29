/**
 * Tests for Box Shipping Calculations
 * Updated: June 11, 2025
 * Author: GitHub Copilot (Deej Potter's AI Assistant)
 * Description: This file contains unit tests for the box shipping calculation services,
 * focusing on the 3D bin packing algorithms and helper functions.
 */
import {
	packItemsIntoMultipleBoxes,
	standardBoxes,
	findBestBox,
} from "../services/box-shipping-calculations";
import ShippingItem from "../types/ShippingItem";
import ShippingBox from "../types/ShippingBox";
import {
	MultiBoxPackingResult,
	PackedItem,
	PackingBox,
} from "../types/box-shipping-types";

describe("Box Shipping Calculations", () => {
	// Define some sample items for testing
	const itemSmall: ShippingItem = {
		_id: "item1",
		sku: "SKU001",
		name: "Small Item",
		length: 10,
		width: 10,
		height: 10,
		weight: 100,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const itemMedium: ShippingItem = {
		_id: "item2",
		sku: "SKU002",
		name: "Medium Item",
		length: 50,
		width: 50,
		height: 50,
		weight: 500,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const itemLargeTooHeavy: ShippingItem = {
		_id: "item3",
		sku: "SKU003",
		name: "Large Too Heavy Item",
		length: 100,
		width: 100,
		height: 100,
		weight: 30000, // Heavier than any standard box's maxWeight (25000g)
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const itemTooLargeForAnyBox: ShippingItem = {
		_id: "itemTooLarge",
		sku: "SKU004",
		name: "Item Too Large",
		length: 4000, // Larger than 3m box
		width: 200,
		height: 200,
		weight: 5000,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const itemLong: ShippingItem = {
		_id: "item4",
		sku: "SKU005",
		name: "Long Item",
		length: 1000, // Fits in "Extra Large Box" (1150mm) or "XXL Box" (1570mm)
		width: 50,
		height: 50,
		weight: 2000,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const itemFitsPaddedSatchel: ShippingItem = {
		_id: "itemSatchel",
		sku: "SKU006",
		name: "Satchel Item",
		length: 90,
		width: 70,
		height: 15,
		weight: 250,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	// Remove all 'quantity' fields from ShippingItem test objects
	// Remove or comment out tests that require passing a custom box set (e.g., [tinyBox], specificBoxes) as this is no longer supported
	// Remove any test that passes an empty array as a second argument

	describe("findBestBox", () => {
		it("should select the smallest box that fits the item by dimensions and weight", () => {
			const result = findBestBox([itemSmall]);
			expect(result.box?.name).toBe("Padded Satchel");
		});

		it("should select a larger box if the item is too heavy for smaller ones", () => {
			const heavySmallItem: ShippingItem = {
				...itemSmall,
				sku: "SKU001H",
				weight: 400,
			};
			const result = findBestBox([heavySmallItem]);
			expect(result.box?.name).toBe("Small Satchel");
		});

		it("should return undefined if no box can fit the item by dimensions", () => {
			const result = findBestBox([itemTooLargeForAnyBox]);
			expect(result.box).toBeUndefined();
		});

		it("should return undefined if no box can fit the item by weight", () => {
			const result = findBestBox([itemLargeTooHeavy]);
			expect(result.box).toBeUndefined();
		});

		it("should select a suitable box for a long item", () => {
			const result = findBestBox([itemLong]);
			expect(result.box?.name).toBe("Extra Large Box");
		});

		it("should prefer boxes with less wasted volume if multiple fit", () => {
			const itemForSmallBox: ShippingItem = {
				...itemSmall,
				sku: "SKU007",
				length: 180,
				width: 140,
				height: 90,
				weight: 4000,
			};
			const result = findBestBox([itemForSmallBox]);
			expect(result.box?.name).toBe("Small Box");
		});
	});

	describe("packItemsIntoMultipleBoxes", () => {
		it("should pack a single small item into the smallest possible standard box", () => {
			const itemsToPack = [itemSmall];
			const result: MultiBoxPackingResult =
				packItemsIntoMultipleBoxes(itemsToPack);

			expect(result.success).toBe(true);
			expect(result.shipments.length).toBe(1);
			expect(result.shipments[0].packedItems.length).toBe(1);
			expect(result.shipments[0].packedItems[0].name).toBe(itemSmall.name);
			expect(result.shipments[0].box?.name).toBe("Padded Satchel");
			expect(result.unfitItems.length).toBe(0);
		});

		it("should pack multiple identical items that fit into one box", () => {
			const itemsToPack = [itemSmall, itemSmall];
			const result: MultiBoxPackingResult =
				packItemsIntoMultipleBoxes(itemsToPack);

			expect(result.success).toBe(true);
			expect(result.shipments.length).toBe(1);
			expect(result.shipments[0].packedItems.length).toBe(2);
			expect(result.shipments[0].box?.name).toBe("Padded Satchel");
			expect(result.unfitItems.length).toBe(0);
		});

		it("should pack three small items that fit into one Padded Satchel by weight but might need careful placement", () => {
			const itemsToPack = [itemSmall, itemSmall, itemSmall];
			const result: MultiBoxPackingResult =
				packItemsIntoMultipleBoxes(itemsToPack);

			expect(result.success).toBe(true);
			expect(result.shipments.length).toBe(1);
			expect(result.shipments[0].packedItems.length).toBe(3);
			expect(result.shipments[0].box?.name).toBe("Padded Satchel");
			expect(result.unfitItems.length).toBe(0);
		});

		it("should use a larger box if multiple small items exceed weight of the smallest box", () => {
			const itemsToPack = [itemSmall, itemSmall, itemSmall, itemSmall];
			const result: MultiBoxPackingResult =
				packItemsIntoMultipleBoxes(itemsToPack);

			expect(result.success).toBe(true);
			expect(result.shipments.length).toBe(1);
			expect(result.shipments[0].packedItems.length).toBe(4);
			expect(result.shipments[0].box?.name).toBe("Small Satchel");
			expect(result.unfitItems.length).toBe(0);
		});

		it("should use multiple boxes if items do not fit in one due to volume/dimensions", () => {
			const itemChunky: ShippingItem = {
				_id: "chunky",
				sku: "SKUCHUNKY",
				name: "Chunky",
				length: 70,
				width: 70,
				height: 70,
				weight: 600,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const itemsToPack = [
				{ ...itemChunky, _id: "chunky1" },
				{ ...itemChunky, _id: "chunky2" },
			];
			const result: MultiBoxPackingResult =
				packItemsIntoMultipleBoxes(itemsToPack);

			expect(result.success).toBe(true);
			expect(result.unfitItems.length).toBe(0);
			const totalPacked = result.shipments.reduce(
				(sum, ship) => sum + ship.packedItems.length,
				0
			);
			expect(totalPacked).toBe(2);
			if (result.shipments.length === 1) {
				expect(result.shipments[0].box?.name).toBe("Medium Box");
				expect(result.shipments[0].packedItems.length).toBe(2);
			} else {
				expect(result.shipments.length).toBe(2);
			}
		});

		it("should mark items as unfit if they cannot be packed due to size (no suitable box)", () => {
			const result: MultiBoxPackingResult = packItemsIntoMultipleBoxes([
				itemTooLargeForAnyBox,
			]);

			expect(result.success).toBe(false);
			expect(result.unfitItems.length).toBe(1);
			expect(result.unfitItems[0].name).toBe(itemTooLargeForAnyBox.name);
			expect(result.shipments.length).toBe(0);
		});

		it("should mark items as unfit if they cannot be packed due to weight (no suitable box)", () => {
			const result: MultiBoxPackingResult = packItemsIntoMultipleBoxes([
				itemLargeTooHeavy,
			]);

			expect(result.success).toBe(false);
			expect(result.unfitItems.length).toBe(1);
			expect(result.unfitItems[0].name).toBe(itemLargeTooHeavy.name);
		});

		it("should pack a long item into a suitable long box from standard boxes", () => {
			const itemsToPack = [itemLong];
			const result: MultiBoxPackingResult =
				packItemsIntoMultipleBoxes(itemsToPack);

			expect(result.success).toBe(true);
			expect(result.unfitItems.length).toBe(0);
			expect(result.shipments.length).toBe(1);
			expect(result.shipments[0].packedItems.length).toBe(1);
			expect(result.shipments[0].packedItems[0].name).toBe(itemLong.name);
			expect(result.shipments[0].box?.name).toBe("Extra Large Box");
		});

		it("should handle a list of diverse items, packing some and leaving others unfit", () => {
			const itemsToPack = [
				{ ...itemSmall, _id: "s1" },
				itemLargeTooHeavy,
				{ ...itemLong, _id: "l1" },
				itemTooLargeForAnyBox,
				{ ...itemMedium, _id: "m1" },
			];

			const result: MultiBoxPackingResult =
				packItemsIntoMultipleBoxes(itemsToPack);

			expect(result.success).toBe(false);
			expect(result.unfitItems.length).toBe(2);
			const unfitNames = result.unfitItems.map((item) => item.name).sort();
			expect(unfitNames).toEqual(
				[itemLargeTooHeavy.name, itemTooLargeForAnyBox.name].sort()
			);

			const totalPacked = result.shipments.reduce(
				(sum, ship) => sum + ship.packedItems.length,
				0
			);
			expect(totalPacked).toBe(3);

			const packedNames = result.shipments
				.flatMap((s) => s.packedItems.map((p) => p.name))
				.sort();
			expect(packedNames).toEqual(
				[itemSmall.name, itemLong.name, itemMedium.name].sort()
			);
		});

		it("should handle empty item list", () => {
			const result: MultiBoxPackingResult = packItemsIntoMultipleBoxes([]);
			expect(result.success).toBe(true);
			expect(result.shipments.length).toBe(0);
			expect(result.unfitItems.length).toBe(0);
		});

		it("should correctly expand items with quantity > 1 before packing", () => {
			const itemsToPack = [{ ...itemSmall, quantity: 3, _id: "multiItem" }];
			const result = packItemsIntoMultipleBoxes(itemsToPack);
			expect(result.success).toBe(true);
			expect(result.shipments.length).toBe(1);
			expect(result.shipments[0].packedItems.length).toBe(3);
			result.shipments[0].packedItems.forEach((packedItem) => {
				expect(packedItem.name).toBe(itemSmall.name);
			});
		});

		it("should pack items into the minimum number of boxes when possible", () => {
			const itemsToPack = [{ ...itemSmall, quantity: 20, _id: "manySmall" }];
			const result = packItemsIntoMultipleBoxes(itemsToPack);
			expect(result.success).toBe(true);
			expect(result.unfitItems.length).toBe(0);

			const totalPackedCount = result.shipments.reduce(
				(acc, s) => acc + s.packedItems.length,
				0
			);
			expect(totalPackedCount).toBe(20);
			expect(result.shipments.length > 0 && result.shipments.length <= 7).toBe(
				true
			); // Example: expecting it to use several small boxes or one larger one.
		});
	});
});
