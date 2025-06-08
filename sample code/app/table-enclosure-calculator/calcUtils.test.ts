/**
 * Tests for Table and Enclosure Calculator Utilities
 * Updated: 14/05/2025
 * Author: Deej Potter
 * Description: Test suite for the calculation utility functions used by the Table and Enclosure Calculator component.
 * These tests focus on the pure calculation functions without UI dependencies.
 */

import {
	calculateTableMaterials,
	calculateEnclosureMaterials,
	calculateMountingMaterials,
	calculateDoorMaterials,
	calculatePanelMaterials,
	CONSTANTS,
	Dimensions,
} from "./calcUtils";

describe("Table Materials Calculations", () => {
	it("calculates adjusted dimensions correctly for outside dimensions", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = true;

		const result = calculateTableMaterials(dimensions, isOutsideDimension);

		// For outside dimensions, subtract 40mm for adjustment (40mm for 4040 extrusion)
		expect(result.extrusions.rail2060Length).toBe(960);
		expect(result.extrusions.rail2060Width).toBe(760);
		expect(result.extrusions.rail4040Legs).toBe(750);
	});

	it("uses dimensions as-is for inside dimensions", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = false;

		const result = calculateTableMaterials(dimensions, isOutsideDimension);

		// For inside dimensions, no adjustment
		expect(result.extrusions.rail2060Length).toBe(1000);
		expect(result.extrusions.rail2060Width).toBe(800);
		expect(result.extrusions.rail4040Legs).toBe(750);
	});

	it("calculates total extrusion lengths correctly", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = true;

		const result = calculateTableMaterials(dimensions, isOutsideDimension);

		// Total 2060 = (length extrusions * 4) + (width extrusions * 4)
		expect(result.totalLengths.rail2060).toBe(960 * 4 + 760 * 4);

		// Total 4040 = leg extrusions * 4
		expect(result.totalLengths.rail4040).toBe(750 * 4);
	});

	it("calculates extrusion quantities correctly", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = true;

		const result = calculateTableMaterials(dimensions, isOutsideDimension);

		expect(result.extrusions.qtyRail2060Length).toBe(4);
		expect(result.extrusions.qtyRail2060Width).toBe(4);
		expect(result.extrusions.qtyRail4040Legs).toBe(4);
	});
});

describe("Enclosure Materials Calculations", () => {
	it("uses 2020 extrusions for standard dimensions", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = true;

		const result = calculateEnclosureMaterials(dimensions, isOutsideDimension);

		expect(result.extrusions.horizontal.length.type).toBe("2020");
		expect(result.extrusions.horizontal.width.type).toBe("2020");
	});
	it("uses 2040 extrusions for dimensions >= 1500mm", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1500,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = true;

		const result = calculateEnclosureMaterials(dimensions, isOutsideDimension);

		expect(result.extrusions.horizontal.length.type).toBe("2040");
		expect(result.extrusions.horizontal.width.type).toBe("2020");
	});
	it("adds extra hardware for large sides", () => {
		const standardDimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};

		const largeDimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1500,
			width: 800,
			height: 750,
		};

		const isOutsideDimension = true;

		const standardResult = calculateEnclosureMaterials(
			standardDimensions,
			isOutsideDimension
		);
		const largeResult = calculateEnclosureMaterials(
			largeDimensions,
			isOutsideDimension
		);

		// Large dimensions should have extra T-nuts and bolts
		expect(largeResult.hardware.T_NUT_SLIDING).toBe(
			standardResult.hardware.T_NUT_SLIDING +
				CONSTANTS.EXTRA_HARDWARE_FOR_1_5M.T_NUT_SLIDING
		);

		expect(largeResult.hardware.CAP_HEAD_M5_8MM).toBe(
			standardResult.hardware.CAP_HEAD_M5_8MM +
				CONSTANTS.EXTRA_HARDWARE_FOR_1_5M.CAP_HEAD_M5_8MM
		);
	});

	it("calculates adjusted dimensions correctly for outside dimensions", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1200,
			width: 900,
			height: 600,
		};
		const isOutsideDimension = true;
		const result = calculateEnclosureMaterials(dimensions, isOutsideDimension);
		// Example assertion, replace with actual logic from your function
		// Assuming adjustment similar to table, but specific to enclosure
		expect(result.extrusions.horizontal.length.size).toBeLessThan(1200);
	});
});

describe("Door Materials Calculations", () => {
	it("calculates hardware quantities based on number of doors", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = true;

		const noDoors = {
			frontDoor: false,
			backDoor: false,
			leftDoor: false,
			rightDoor: false,
			doorType: "STND",
		};

		const twoDoors = {
			frontDoor: true,
			backDoor: false,
			leftDoor: true,
			rightDoor: false,
			doorType: "STND",
		};

		const fourDoors = {
			frontDoor: true,
			backDoor: true,
			leftDoor: true,
			rightDoor: true,
			doorType: "STND",
		};

		const noDoorsResult = calculateDoorMaterials(
			dimensions,
			isOutsideDimension,
			noDoors
		);
		const twoDoorsResult = calculateDoorMaterials(
			dimensions,
			isOutsideDimension,
			twoDoors
		);
		const fourDoorsResult = calculateDoorMaterials(
			dimensions,
			isOutsideDimension,
			fourDoors
		);

		// No doors should have empty panels array
		expect(noDoorsResult.panels).toHaveLength(0);

		// Two doors should have two panel entries and hardware for two doors
		expect(twoDoorsResult.panels).toHaveLength(2);
		expect(twoDoorsResult.hardware.HINGE).toBe(
			CONSTANTS.DOOR_HARDWARE.HINGE * 2
		);

		// Four doors should have four panel entries and hardware for four doors
		expect(fourDoorsResult.panels).toHaveLength(4);
		expect(fourDoorsResult.hardware.HINGE).toBe(
			CONSTANTS.DOOR_HARDWARE.HINGE * 4
		);
	});
	it("calculates door panel dimensions correctly", () => {
		const dimensions: Omit<Dimensions, "isOutsideDimension"> = {
			length: 1000,
			width: 800,
			height: 750,
		};
		const isOutsideDimension = true;

		const doors = {
			frontDoor: true,
			backDoor: true,
			leftDoor: true,
			rightDoor: true,
			doorType: "STND",
		};

		const result = calculateDoorMaterials(
			dimensions,
			isOutsideDimension,
			doors
		);

		// Door panel dimensions should be adjusted based on enclosure dimensions
		// For outside dimensions with 2020 extrusions:
		// - Adjusted length = 1000 - 20 = 980
		// - Adjusted width = 800 - 20 = 780
		// - Panel adjustment = +12mm (as specified)
		// Check front and back door width
		const frontDoor = result.panels.find((p) => p.position === "Front");
		expect(frontDoor?.width).toBe(748); // 800 - 20*2 - 12 = 748
		expect(frontDoor?.height).toBe(698); // 750 - 20*2 - 12 = 698

		// Check side door width
		const leftDoor = result.panels.find((p) => p.position === "Left");
		expect(leftDoor?.width).toBe(948); // 1000 - 20*2 - 12 = 948
		expect(leftDoor?.height).toBe(698); // 750 - 20*2 - 12 = 698
	});
});

describe("Panel Materials Calculations", () => {
	it("calculates panel dimensions correctly", () => {
		const dimensions: Dimensions = {
			length: 1000,
			width: 800,
			height: 750,
			isOutsideDimension: true,
		};

		const materialConfig = {
			type: "acrylic",
			thickness: 3,
			panelConfig: {
				top: true,
				bottom: true,
				left: true,
				right: true,
				back: true,
				front: true,
			},
		};
		const result = calculatePanelMaterials(
			dimensions,
			dimensions.isOutsideDimension,
			materialConfig
		);
		// Should have 6 panels (all sides including front)
		expect(result.panels).toHaveLength(6);

		// Check material properties
		expect(result.material.type).toBe("acrylic");
		expect(result.material.thickness).toBe(3);

		// Panel dimensions should be adjusted based on enclosure dimensions
		// For outside dimensions with 2020 extrusions:
		// - Adjusted length = 1000 - 20*2 = 960
		// - Adjusted width = 800 - 20*2 = 760
		// - Panel adjustment = -12mm for V-slot

		// Check top/bottom panel dimensions
		const topPanel = result.panels.find((p) => p.position === "Top");
		expect(topPanel?.width).toBe(748); // 800 - 20*2 - 12 = 748
		expect(topPanel?.length).toBe(948); // 1000 - 20*2 - 12 = 948

		// Check side panel dimensions
		const leftPanel = result.panels.find((p) => p.position === "Left");
		expect(leftPanel?.width).toBe(948); // 1000 - 20*2 - 12 = 948
		expect(leftPanel?.height).toBe(698); // 750 - 20*2 - 12 = 698
	});

	it("calculates total panel area correctly", () => {
		const dimensions: Dimensions = {
			length: 1000,
			width: 800,
			height: 750,
			isOutsideDimension: true,
		};

		// Only include top and left panels
		const materialConfig = {
			type: "acrylic",
			thickness: 3,
			panelConfig: {
				top: true,
				bottom: false,
				left: true,
				right: false,
				back: false,
			},
		};
		const result = calculatePanelMaterials(
			dimensions,
			dimensions.isOutsideDimension,
			materialConfig
		);

		// Should have 2 panels (top and left)
		expect(result.panels).toHaveLength(2);
		// Calculate expected areas with the updated dimension calculations
		// Top: 748 * 948 = 709,104
		// Left: 948 * 698 = 661,704
		// Total: 1,370,808
		const expectedArea = 748 * 948 + 948 * 698;
		expect(result.totalArea).toBe(expectedArea);
	});
});

describe("Mounting Materials Calculations", () => {
	it("returns the correct hardware quantities", () => {
		const result = calculateMountingMaterials();

		expect(result.hardware.IOCNR_40).toBe(4);
		expect(result.hardware.T_NUT_SLIDING).toBe(16);
		expect(result.hardware.CAP_HEAD_M5_8MM).toBe(16);
	});

	it("includes assembly instructions", () => {
		const result = calculateMountingMaterials();

		expect(result.instructions).toContain("Machine Table Mounting");
		expect(result.instructions).toContain("assembly guide");
	});
});

/**
 * Standard Configuration Test Case
 * This test verifies calculations for a common configuration:
 * - 1000mm × 1000mm working area with standard dimensions
 * - 500mm height full enclosure
 * - Acrylic panels
 */
describe("Standard Configuration Test", () => {
	it("calculates materials for a standard table with enclosure", () => {
		// Table dimensions (1000×1000 working area, 800mm table height)
		const tableDimensions: Dimensions = {
			length: 1000, // 1000mm working area
			width: 1000, // 1000mm working area
			height: 800, // Standard table height
			isOutsideDimension: false, // These are inside dimensions (working area)
		};

		// Full enclosure dimensions
		const enclosureDimensions: Dimensions = {
			length: 1040, // Working area + 40mm for 2060 extrusions
			width: 1040, // Working area + 40mm for 2060 extrusions
			height: 500, // 500mm full enclosure
			isOutsideDimension: false, // These are inside dimensions
		};
		// Calculate materials
		const tableResult = calculateTableMaterials(
			tableDimensions,
			tableDimensions.isOutsideDimension
		);
		const enclosureResult = calculateEnclosureMaterials(
			enclosureDimensions,
			enclosureDimensions.isOutsideDimension
		);
		const mountingResult = calculateMountingMaterials();
		// Standard panel configuration (with top panel)
		const panelConfig = {
			type: "acrylic",
			thickness: 3, // Standard acrylic thickness
			panelConfig: {
				top: true,
				bottom: false,
				left: true,
				right: true,
				back: true,
			},
		};
		const panelResult = calculatePanelMaterials(
			enclosureDimensions,
			enclosureDimensions.isOutsideDimension,
			panelConfig
		);
		// Test table calculations
		expect(tableResult.extrusions.rail2060Length).toBe(1000);
		expect(tableResult.extrusions.rail2060Width).toBe(1000);
		expect(tableResult.extrusions.rail4040Legs).toBe(800);

		// Verify table includes foot brackets
		expect(tableResult.hardware.FOOT_BRACKETS).toBe(4);
		expect(tableResult.hardware.FEET).toBe(4);

		// Test enclosure calculations
		expect(enclosureResult.extrusions.horizontal.length.size).toBe(1040);
		expect(enclosureResult.extrusions.horizontal.width.size).toBe(1040);
		expect(enclosureResult.extrusions.vertical2020.size).toBe(500);

		// Test panel calculations
		expect(panelResult.material.type).toBe("acrylic");

		// We expect 4 panels (top, left, right, back)
		expect(panelResult.panels).toHaveLength(4);
		// Verify panel dimensions (should be adjusted for 2020 extrusions)
		// For inside dimensions, we don't subtract extrusion width but do account for V-slot reduction
		const backPanel = panelResult.panels.find((p) => p.position === "Back");
		expect(backPanel?.width).toBe(1028); // 1040 - 12 = 1028mm
		expect(backPanel?.height).toBe(488); // 500 - 12 = 488mm

		// Test mounting hardware
		expect(mountingResult.hardware.IOCNR_40).toBe(4);
		expect(mountingResult.hardware.T_NUT_SLIDING).toBe(16);
	});
});
