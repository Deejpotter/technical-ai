/**
 * Tests for BoxResultsDisplay Component
 * Updated: May 13, 2025
 * Author: Deej Potter
 * Description: Tests the BoxResultsDisplay component which shows calculated box metrics
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
	calculateBoxUtilization,
	calculateBoxDimensions,
	BoxResultsDisplay,
} from "./BoxResultsDisplay";
import type { MultiBoxPackingResult } from "./BoxCalculations";
import type ShippingItem from "@/types/box-shipping-calculator/ShippingItem";
import type ShippingBox from "@/types/box-shipping-calculator/ShippingBox";

// Sample data for testing
const mockBox: ShippingBox = {
	_id: "test-box-id",
	name: "Test Box",
	length: 200,
	width: 150,
	height: 100,
	maxWeight: 5000,
};

const mockItems: ShippingItem[] = [
	{
		_id: "item1",
		name: "Small Item",
		sku: "TEST-ITEM-1",
		length: 50,
		width: 40,
		height: 30,
		weight: 500,
		quantity: 2,
	},
	{
		_id: "item2",
		name: "Larger Item",
		sku: "TEST-ITEM-2",
		length: 100,
		width: 80,
		height: 20,
		weight: 1000,
		quantity: 1,
	},
];

const mockPackingResult: MultiBoxPackingResult = {
	success: true,
	shipments: [
		{
			box: mockBox,
			packedItems: mockItems,
		},
	],
	unfitItems: [],
};

describe("BoxResultsDisplay", () => {
	describe("calculateBoxUtilization", () => {
		it("should correctly calculate volume utilization percentage", () => {
			const box = mockBox;
			const items = mockItems;

			// Box volume: 200 * 150 * 100 = 3,000,000 cubic mm
			// Items volumes:
			// - Item 1: 50 * 40 * 30 * 2 = 120,000 cubic mm
			// - Item 2: 100 * 80 * 20 = 160,000 cubic mm
			// Total items volume: 280,000 cubic mm
			// Expected utilization: 280,000 / 3,000,000 = 0.0933... (9.33%)

			const result = calculateBoxUtilization(box, items);
			expect(result.volumePercentage).toBeCloseTo(9.33, 1);
		});

		it("should correctly calculate weight utilization percentage", () => {
			const box = mockBox; // 5000g capacity
			const items = mockItems;
			// Total weight: (500g * 2) + (1000g * 1) = 2000g
			// Expected utilization: 2000 / 5000 = 0.4 (40%)

			const result = calculateBoxUtilization(box, items);
			expect(result.weightPercentage).toBeCloseTo(40, 0);
		});
	});

	describe("calculateBoxDimensions", () => {
		it("should correctly calculate total dimensions of items", () => {
			const items = mockItems;

			const result = calculateBoxDimensions(items);

			// Expected dimensions based on our mock items:
			// Item 1: 50 x 40 x 30 mm (qty: 2)
			// Item 2: 100 x 80 x 20 mm (qty: 1)

			// For a simple implementation, we might take the max dimensions across all items
			// Total length: max(50, 100) = 100
			// Total width: max(40, 80) = 80
			// Total height: max(30, 20) = 30 (or sum of heights: 30 + 20 = 50)

			expect(result.totalLength).toBe(100); // Max length
			expect(result.totalWidth).toBe(80); // Max width
			expect(result.totalHeight).toBe(80); // Sum of heights
			expect(result.totalVolume).toBe(280000); // Should match the volume calculation
		});

		it("should handle empty items array", () => {
			const result = calculateBoxDimensions([]);

			expect(result.totalLength).toBe(0);
			expect(result.totalWidth).toBe(0);
			expect(result.totalHeight).toBe(0);
			expect(result.totalVolume).toBe(0);
		});
	});
	describe("BoxResultsDisplay component", () => {
		it("should render box result information", () => {
			render(<BoxResultsDisplay packingResult={mockPackingResult} />);

			// Check for box packing results heading
			expect(screen.getByText("Box Packing Results")).toBeInTheDocument();

			// Check if the box name is displayed (format is "Box 1: Test Box")
			expect(screen.getByText(/Box 1: Test Box/)).toBeInTheDocument();

			// Check if item names are displayed
			expect(screen.getByText(/Small Item/)).toBeInTheDocument();
			expect(screen.getByText(/Larger Item/)).toBeInTheDocument();
			// Check if the box dimensions are displayed
			expect(screen.getByText(/Box Dimensions:/)).toBeInTheDocument();
			expect(screen.getByText(/200 × 150 × 100 mm/)).toBeInTheDocument();

			// Check if the items dimensions are displayed			expect(screen.getByText(/Items Dimensions:/)).toBeInTheDocument();
			expect(screen.getByText(/100 × 80 × 80 mm/)).toBeInTheDocument();

			// Check if total weight is displayed (500*2 + 1000*1 = 2000g)
			expect(screen.getByText(/2000g \/ 5000g/)).toBeInTheDocument();

			// Check if volume utilization is displayed
			expect(screen.getByText("9.3%")).toBeInTheDocument();

			// Check if weight utilization is displayed
			expect(screen.getByText("40.0%")).toBeInTheDocument();
		});

		it("should display a message when no items fit in any box", () => {
			const noFitResult: MultiBoxPackingResult = {
				success: false,
				shipments: [],
				unfitItems: mockItems,
			};

			render(<BoxResultsDisplay packingResult={noFitResult} />);
			expect(
				screen.getByText(/Some items could not fit in any available box/i)
			).toBeInTheDocument();
		});
	});
});
