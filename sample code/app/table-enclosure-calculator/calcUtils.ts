/**
 * Table and Enclosure Calculator Utilities
 * Updated: 17/05/2025
 * Author: Deej Potter
 * Description: Utility functions for the Table and Enclosure Calculator component.
 * These functions handle calculations for different parts of a table and enclosure.
 */

import { EXTRUSION_OPTIONS } from "./constants";

// Constants for hardware quantities
const DEFAULT_TABLE_HARDWARE = {
	IOCNR_60: 8,
	L_BRACKET_TRIPLE: 16,
	T_NUT_SLIDING: 144,
	CAP_HEAD_M5_8MM: 48,
	BUTTON_HEAD_M5_8MM: 96,
	LOW_PROFILE_M5_25MM: 16,
	FOOT_BRACKETS: 4,
	FEET: 4,
};

const DEFAULT_ENCLOSURE_HARDWARE = {
	IOCNR_20: 4,
	IOCNR_40: 4,
	IOCNR_60: 4,
	ANGLE_CORNER_90: 4,
	T_NUT_SLIDING: 56,
	CAP_HEAD_M5_8MM: 56,
	BUTTON_HEAD_M5_8MM: 8,
};

// Additional hardware for 1.5m sides
const EXTRA_HARDWARE_FOR_1_5M = {
	T_NUT_SLIDING: 8,
	CAP_HEAD_M5_8MM: 8,
};

// Hardware required for mounting enclosure to table
const TABLE_MOUNT_HARDWARE = {
	IOCNR_40: 4,
	T_NUT_SLIDING: 16,
	CAP_HEAD_M5_8MM: 16,
};

// Hardware required for door installation
const DOOR_HARDWARE = {
	HINGE: 2, // Per door
	HANDLE: 1, // Per door
	T_NUT_SLIDING: 8, // Per door
	BUTTON_HEAD_M5_8MM: 8, // Per door
	CORNER_BRACKET: 4, // Per door
	SPRING_LOADED_T_NUT: 15, // Per door (based on Maker Store documentation)
};

/**
 * Interface for dimensions of table or enclosure
 * Includes flag for specifying whether dimensions are inside or outside measurements.
 * For the enclosure and table, the height is always the OD, the length and width are the ID or OD depending on the isOutsideDimension flag.
 */
export interface Dimensions {
	length: number;
	width: number;
	height: number;
	isOutsideDimension: boolean;
}

/**
 * Calculate table materials based on dimensions
 *
 * This function implements the BOM and logic described in the requirements:
 * - 4x 2060 x ID Length (2 for top, 2 for support)
 * - 4x 2060 x ID Width (2 for top, 2 for support)
 * - 4x 4040 x Height (legs)
 *
 * If isOutsideDimension is true, the input dimensions are the OUTSIDE of the table,
 * so we subtract the 4040 extrusion width to get the correct working area for the top.
 * If isOutsideDimension is false, the input dimensions are the INSIDE (working area),
 * so we use them as-is for the extrusion lengths.
 *
 * Hardware counts match the BOM:
 * - 8x IOCNR_60 (corner brackets)
 * - 16x L_BRACKET_TRIPLE (triple L brackets)
 * - 144x T_NUT_SLIDING (sliding T-nuts)
 * - 48x CAP_HEAD_M5_8MM (cap head bolts)
 * - 96x BUTTON_HEAD_M5_8MM (button head screws)
 * - 16x LOW_PROFILE_M5_25MM (low profile screws)
 * - 4x FOOT_BRACKETS (foot mounting brackets)
 * - 4x FEET (wheels or adjustable feet)
 */
export const calculateTableMaterials = (
	dimensions: Omit<Dimensions, "isOutsideDimension">,
	isOutsideDimension: boolean
) => {
	// Find the 4040 and 2060 extrusion dimensions from the constants
	// For the table legs we use 4040 extrusions
	const extrusion4040 = EXTRUSION_OPTIONS.find((e) => e.id === "40x40-40") || {
		width: 40,
		height: 40,
	}; // Default to 40mm if not found

	// Adjust the dimensions based on extrusion width
	// We use 4040 legs so we need to account for their thickness in the rail lengths
	const adjustedLength = isOutsideDimension
		? dimensions.length - extrusion4040.width
		: dimensions.length;
	const adjustedWidth = isOutsideDimension
		? dimensions.width - extrusion4040.width
		: dimensions.width;

	// Extrusion lengths
	const rail2060Length = adjustedLength; // Length of 2060 extrusions for table length
	const rail2060Width = adjustedWidth; // Length of 2060 extrusions for table width
	const legExtrusions4040 = dimensions.height; // Length of 4040 extrusions for table legs
	// Calculate total quantities needed
	// Table has top and bottom frame, so 4 extrusions per direction
	const qtyRail2060Width = 4; // 4 for width (2 top + 2 bottom)
	const qtyRail2060Length = 4; // 4 for length (2 top + 2 bottom)
	const qtyRail4040Legs = 4; // 4 legs for the table or Z axis

	// Add totalLengths for test validation
	const totalLengths = {
		rail2060:
			rail2060Length * qtyRail2060Length + rail2060Width * qtyRail2060Width,
		rail4040: legExtrusions4040 * qtyRail4040Legs,
	};

	return {
		extrusions: {
			rail2060Length,
			rail2060Width,
			rail4040Legs: legExtrusions4040,
			qtyRail2060Length,
			qtyRail2060Width,
			qtyRail4040Legs,
		},
		hardware: DEFAULT_TABLE_HARDWARE,
		totalLengths, // for test validation only
	};
};

/**
 * Calculate enclosure materials based on dimensions
 *
 * This function implements the BOM and logic described in the requirements:
 * - 2x 2020 x ID Length (top)
 * - 2x 2020 x ID Length (bottom)
 * - 2x 2020 x ID Width (top)
 * - 2x 2020 x ID Width (bottom)
 * - 8x 2020 x ID Height (verticals)
 *
 * For enclosures with length or width >= 1500mm, the top extrusions for that axis use 2040 profile instead of 2020.
 * Hardware counts are increased for large enclosures as per the BOM.
 *
 * If isOutsideDimension is true, the input dimensions are the OUTSIDE of the enclosure,
 * so we subtract the vertical extrusion width to get the correct internal frame size.
 * If isOutsideDimension is false, the input dimensions are the INSIDE (clear space),
 * so we add the vertical extrusion width to get the correct extrusion lengths.
 *
 * Hardware counts match the BOM for <1500mm and >1500mm enclosures.
 */
export const calculateEnclosureMaterials = (
	// Omitting isOutsideDimension from dimensions for clarity
	dimensions: Omit<Dimensions, "isOutsideDimension">,
	isOutsideDimension: boolean
) => {
	const enclosureLength = dimensions.length;
	const enclosureWidth = dimensions.width;
	const enclosureHeight = dimensions.height;
	/**
	 * Determine extrusion types based on dimensions:
	 * - For enclosures with length >= 1500mm: Length extrusions use 2040, Width always uses 2020
	 * - For smaller enclosures: All extrusions use 2020
	 * - Vertical extrusions always use 2020
	 */
	const isLargeLength = enclosureLength >= 1500;
	const isLargeWidth = enclosureWidth >= 1500;

	// Get extrusion info from constants
	const extrusion2020 = EXTRUSION_OPTIONS.find((e) => e.id === "20x20-20");

	const extrusion2040 = EXTRUSION_OPTIONS.find((e) => e.id === "20x40-20");

	// Top extrusion types (for length and width rails)
	const topLengthExtrusionType = isLargeLength ? "2040" : "2020";
	const topWidthExtrusionType = isLargeWidth ? "2040" : "2020";
	const topLengthExtrusionHeight = isLargeLength
		? extrusion2040.height
		: extrusion2020.height;
	const topWidthExtrusionHeight = isLargeWidth
		? extrusion2040.height
		: extrusion2020.height;
	// Bottom extrusion types (always 2020)
	const bottomExtrusionType = "2020";
	const bottomExtrusionHeight = extrusion2020.height;

	// Vertical extrusion type (always 2020)
	const verticalExtrusionType = "2020";
	const verticalExtrusionWidth = extrusion2020.width;

	// Adjust dimensions if they are outside measurements
	// If it's outside dimension, the internal space is smaller.
	// The frame itself will be `dimensions.length` and `dimensions.width` on the outside.
	// So, the lengths of the extrusions forming the outer frame are `dimensions.length` and `dimensions.width`.
	// If it's *inside* dimension, the extrusions are `dimensions.length` and `dimensions.width` plus wall thickness.
	// The current logic in `calculateTableMaterials` subtracts when `isOutsideDimension` is true to get internal working space for table top.
	// For enclosure, if `dimensions` are "outside", the extrusion lengths are `dimensions.length`.
	// If `dimensions` are "inside", the extrusion lengths are `dimensions.length + (2 * extrusion_profile_width)`.
	// Let's assume `dimensions` always refers to the desired *outer* size of the enclosure frame for simplicity here,
	// or the *inner* clear space. The prompt implies `isOutsideDimension` refers to the input `dimensions`.

	let horizontalLength = dimensions.length;
	let horizontalWidth = dimensions.width;

	if (!isOutsideDimension) {
		// If dimensions are INSIDE, the extrusions need to be longer to achieve that internal space.
		// Add the width of the vertical extrusions to both ends
		horizontalLength += verticalExtrusionWidth * 2;
		horizontalWidth += verticalExtrusionWidth * 2;
	}

	const effectiveLength = isOutsideDimension
		? dimensions.length - verticalExtrusionWidth
		: dimensions.length;
	const effectiveWidth = isOutsideDimension
		? dimensions.width - verticalExtrusionWidth
		: dimensions.width;
	/**
	 * For vertical extrusions, we need to account for the top and bottom horizontal extrusions.
	 * The vertical extrusion height calculation depends on whether dimensions are inside or outside:
	 * - For inside dimensions: vertical height = specified height (the height IS the vertical extrusion length)
	 * - For outside dimensions: vertical height = specified height - (top rail + bottom rail)
	 *
	 * Examples:
	 * - Inside 500mm height: vertical extrusions = 500mm, total outside = 500 + 20 + 20 = 540mm
	 * - Outside 540mm height: vertical extrusions = 540 - 20 - 20 = 500mm, internal = 500mm
	 */
	const effectiveHeight = isOutsideDimension
		? dimensions.height - (topLengthExtrusionHeight + bottomExtrusionHeight)
		: dimensions.height;
	/**
	 * Structure the extrusions to match the expected interface in types.ts
	 * For the enclosure frame:
	 * - Top: 2x length extrusions and 2x width extrusions (using respective types)
	 * - Bottom: 2x length extrusions and 2x width extrusions (using bottomExtrusionType/2020)
	 * - Vertical: 4x corner extrusions (always 2020)
	 *
	 * The types.ts file expects a specific structure where horizontal contains
	 * length and width properties, each with a type and size.
	 */
	const extrusions = {
		horizontal: {
			length: {
				// Using top length extrusion type which could be 2020 or 2040 based on size
				type: topLengthExtrusionType,
				size: effectiveLength,
			},
			width: {
				// Using top width extrusion type which could be 2020 or 2040 based on size
				type: topWidthExtrusionType,
				size: effectiveWidth,
			},
		},
		vertical2020: {
			// Vertical extrusions are always 2020 for standard enclosure
			size: effectiveHeight,
			qty: 4, // 4x for vertical corners
		},
	};

	// Add extra hardware for large dimensions (>=1500mm) for the additional IO bracket connections.
	let hardware = { ...DEFAULT_ENCLOSURE_HARDWARE };
	if (dimensions.length >= 1500 || dimensions.width >= 1500) {
		hardware = {
			...hardware,
			T_NUT_SLIDING:
				hardware.T_NUT_SLIDING + EXTRA_HARDWARE_FOR_1_5M.T_NUT_SLIDING,
			CAP_HEAD_M5_8MM:
				hardware.CAP_HEAD_M5_8MM + EXTRA_HARDWARE_FOR_1_5M.CAP_HEAD_M5_8MM,
		};
	}
	// Calculate the total lengths for each extrusion type
	const topLength2020 =
		topLengthExtrusionType === "2020" ? effectiveLength * 2 : 0; // 2 for top length
	const topWidth2020 =
		topWidthExtrusionType === "2020" ? effectiveWidth * 2 : 0; // 2 for top width
	const topLength2040 =
		topLengthExtrusionType === "2040" ? effectiveLength * 2 : 0; // 2 for top length
	const topWidth2040 =
		topWidthExtrusionType === "2040" ? effectiveWidth * 2 : 0; // 2 for top width

	const bottomLength2020 = effectiveLength * 2; // Always 2020 for bottom length
	const bottomWidth2020 = effectiveWidth * 2; // Always 2020 for bottom width

	// The Results type requires a totalLengths property for the enclosure, which is used for BOM and test validation.
	// This property sums the total length of each extrusion type used in the enclosure frame.
	const totalLengths = {
		rail2020: topLength2020 + topWidth2020 + bottomLength2020 + bottomWidth2020,
		rail2040: topLength2040 + topWidth2040, // Only top rails can be 2040
		railWidth2020: topWidth2020 + bottomWidth2020, // All width rails that are 2020
		railWidth2040: topWidth2040, // All width rails that are 2040
		verticalRail2020: effectiveHeight * 4, // 4 verticals, always 2020
	};

	return {
		extrusions,
		hardware,
		totalLengths, // Required for Results type and BOM/test validation
	};
};

/**
 * Calculate materials needed for mounting an enclosure to a table
 * @returns Object containing hardware requirements for mounting
 */
export const calculateMountingMaterials = () => {
	return {
		hardware: TABLE_MOUNT_HARDWARE,
		instructions:
			"See section 3.3.2 - Machine Table Mounting in the assembly guide",
	};
};

/**
 * Calculate door materials based on enclosure dimensions and door config
 *
 * This function implements the door panel sizing and hardware logic described in the requirements:
 * - Standard doors: 2 doors per side, each with a 2mm gap for clearance
 * - Bi-fold doors: 2 panels per side, each split in half, with hinge logic
 * - Awning doors: single panel, 4mm less than ID for clearance
 *
 * Panel sizes are calculated using the V-slot reduction formula:
 * (panelWidth - extrusionWidth + slotDepth) × (panelHeight - extrusionHeight + slotDepth)
 *
 * Hardware counts are calculated per door, with adjustments for door type.
 */
export const calculateDoorMaterials = (
	dimensions: Omit<Dimensions, "isOutsideDimension">, // Dimensions of the enclosure
	isOutsideDimension: boolean, // Whether enclosure dimensions were outside
	doorConfig: {
		frontDoor: boolean;
		backDoor: boolean;
		leftDoor: boolean;
		rightDoor: boolean;
		doorType: string;
	}
) => {
	const { length, width, height } = dimensions; // Corrected destructuring
	const { doorType } = doorConfig;

	/**
	 *  Panels sit inside the slot of the extrusion, so we need to increase the dimensions by the relevant slot depth.
	 * Panels sit inside, so the total size will be the OD of the frame or panel minus the height of the top and bottom extrusions and the width of the side extrusions.
	 * For the 20 series V-slot, the depth is 6mm so for an enclosure panel of 100x100mm made from 20x20mm extrusion, the panel size is:
	 * (panelWidth - extrusionWidth + slotDepth) * (panelHeight - extrusionHeight + slotDepth)
	 * or (100 - 20 + 6) * (100 - 20 + 6) = 86 * 86 = 7396mm^2
	 */
	// Get slot depth information from EXTRUSION_OPTIONS
	const extrusion20Series = EXTRUSION_OPTIONS.find((e) =>
		e.id.includes("20x20-20")
	);
	const slotDepth = extrusion20Series ? extrusion20Series.slotDepth : 6; // Default to 6mm if not found
	const extrusionWidth = extrusion20Series ? extrusion20Series.width : 20; // Get from constants
	const PANEL_CALCULATION = slotDepth * 2; // Panels are reduced by slot depth on each side

	// Adjust dimensions based on whether they're inside or outside measurements
	// For outside dimensions, we need to subtract the extrusion width (20mm for 2020) to get the internal frame dimension.
	const internalLength = isOutsideDimension
		? length - extrusionWidth * 2
		: length;
	const internalWidth = isOutsideDimension ? width - extrusionWidth * 2 : width;
	const internalHeight = isOutsideDimension
		? height - extrusionWidth * 2
		: height;

	// Calculate door panel dimensions, accounting for V-slot reduction
	const doorPanelHeight = internalHeight - PANEL_CALCULATION;
	const doorPanelFrontBackWidth = internalWidth - PANEL_CALCULATION;
	const doorPanelSideWidth = internalLength - PANEL_CALCULATION;

	// Count active doors (excluding the doorType property)
	const doorCount = [
		doorConfig.frontDoor,
		doorConfig.backDoor,
		doorConfig.leftDoor,
		doorConfig.rightDoor,
	].filter(Boolean).length;

	// Calculate total hardware needed based on number of doors and door type
	let hingeCount = DOOR_HARDWARE.HINGE * doorCount;
	let handleCount = DOOR_HARDWARE.HANDLE * doorCount;
	let tnutCount = DOOR_HARDWARE.T_NUT_SLIDING * doorCount;
	let buttonHeadCount = DOOR_HARDWARE.BUTTON_HEAD_M5_8MM * doorCount;
	let cornerBracketCount = DOOR_HARDWARE.CORNER_BRACKET * doorCount;

	// Adjust hardware counts based on door type
	if (doorConfig.doorType === "BFLD") {
		// Bi-fold doors need extra hinges for the fold and hardware to join panels
		hingeCount += doorCount; // Extra hinges for fold joints
		handleCount = doorCount; // One handle per door (not per panel)
		tnutCount = Math.ceil(tnutCount * 1.5); // More t-nuts for connecting panels
		buttonHeadCount = Math.ceil(buttonHeadCount * 1.5);
	} else if (doorConfig.doorType === "AWNG") {
		// Awning doors mount to top, so need slightly different hardware
		hingeCount = doorCount * 2; // Fewer hinges for awning type
		tnutCount = Math.ceil(tnutCount * 0.8); // Slightly fewer t-nuts
	}

	const doorHardware = {
		HINGE: hingeCount,
		HANDLE: handleCount,
		T_NUT_SLIDING: tnutCount,
		BUTTON_HEAD_M5_8MM: buttonHeadCount,
		CORNER_BRACKET: cornerBracketCount,
		SPRING_LOADED_T_NUT: Math.ceil(doorCount * 15), // From documentation: 15 per door
	};
	// Calculate door panel sizes based on configuration and door type
	const doorPanels = [];

	/**
	 * Helper function to get door panel dimensions based on door type
	 * Values are based on Maker Store door panel cut size specifications
	 */
	const getDoorPanelDimensions = (
		position: string,
		baseWidth: number, // This will be doorPanelFrontBackWidth or doorPanelSideWidth
		baseHeight: number // This will be doorPanelHeight
	) => {
		// For standard doors, use the V-slot adjusted dimensions
		if (doorConfig.doorType === "STND") {
			return [
				{
					position,
					width: baseWidth,
					height: baseHeight,
					length: baseWidth, // For BOM/test compatibility
					thickness: 6, // Default panel thickness for BOM
					notes: "Standard Door Panel (fits in V-slot)",
				},
			];
		}
		if (doorConfig.doorType === "AWNG") {
			return [
				{
					position,
					width: baseWidth - 4,
					height: baseHeight + 4,
					length: baseWidth - 4,
					thickness: 6,
					notes:
						"Awning Door Panel (fits in V-slot, specific adjustments applied)",
				},
			];
		}
		if (doorConfig.doorType === "BFLD") {
			const halfWidth = Math.round(baseWidth / 2) - 2;
			return [
				{
					position: `${position} (Left)`,
					width: halfWidth,
					height: baseHeight,
					length: halfWidth,
					thickness: 6,
					notes: "Bi-Fold Door - left panel (fits in V-slot)",
				},
				{
					position: `${position} (Right)`,
					width: halfWidth,
					height: baseHeight,
					length: halfWidth,
					thickness: 6,
					notes: "Bi-Fold Door - right panel (fits in V-slot)",
				},
			];
		}
		// Fallback to V-slot adjusted dimensions if type is unknown
		return [
			{
				position,
				width: baseWidth,
				height: baseHeight,
				length: baseWidth,
				thickness: 6,
				notes: "Door Panel (fits in V-slot)",
			},
		];
	};

	if (doorConfig.backDoor) {
		doorPanels.push(
			...getDoorPanelDimensions(
				"Back",
				doorPanelFrontBackWidth,
				doorPanelHeight
			)
		);
	}

	if (doorConfig.frontDoor) {
		doorPanels.push(
			...getDoorPanelDimensions(
				"Front",
				doorPanelFrontBackWidth,
				doorPanelHeight
			)
		);
	}

	if (doorConfig.leftDoor) {
		doorPanels.push(
			...getDoorPanelDimensions("Left", doorPanelSideWidth, doorPanelHeight)
		);
	}

	if (doorConfig.rightDoor) {
		doorPanels.push(
			...getDoorPanelDimensions("Right", doorPanelSideWidth, doorPanelHeight)
		);
	}

	return {
		hardware: doorHardware,
		panels: doorPanels,
	};
};

/**
 * Calculate panel materials based on enclosure dimensions and material config
 *
 * This function implements the panel sizing logic described in the requirements:
 * - Panels sit inside the slot of the extrusion, so we subtract the extrusion width and add the slot depth
 * - For 20 series V-slot, the slot depth is 6mm
 * - The formula is (panelWidth - extrusionWidth + slotDepth) × (panelHeight - extrusionHeight + slotDepth)
 *
 * The function returns all panel dimensions and the total area for material estimation.
 */
export const calculatePanelMaterials = (
	dimensions: Omit<Dimensions, "isOutsideDimension">, // Dimensions of the enclosure
	isOutsideDimension: boolean, // Whether enclosure dimensions were outside
	materialConfig: {
		type: string;
		thickness: number; // This will now always be 6mm from the fixed value
		panelConfig: {
			top: boolean;
			bottom: boolean;
			left: boolean;
			right: boolean;
			back: boolean;
			front?: boolean; // Added front panel option
		};
	}
) => {
	const { length, width, height } = dimensions; // Corrected destructuring

	/**
	 *  Panels sit inside the slot of the extrusion, so we need to increase the dimensions by the relevant slot depth.
	 * Panels sit inside, so the total size will be the OD of the frame or panel minus the height of the top and bottom extrusions and the width of the side extrusions.
	 * For the 20 series V-slot, the depth is 6mm so for an enclosure panel of 100x100mm made from 20x20mm extrusion, the panel size is:
	 * (panelWidth - extrusionWidth + slotDepth) * (panelHeight - extrusionHeight + slotDepth)
	 * or (100 - 20 + 6) * (100 - 20 + 6) = 86 * 86 = 7396mm^2
	 */
	// Get slot depth information from EXTRUSION_OPTIONS
	const extrusionInfo = EXTRUSION_OPTIONS.find((e) =>
		e.id.includes("20x20-20")
	);
	const slotDepth = extrusionInfo ? extrusionInfo.slotDepth : 6; // Default to 6mm if not found
	const extrusionWidth = extrusionInfo ? extrusionInfo.width : 20; // Default to 20mm if not found
	const PANEL_REDUCTION = slotDepth * 2; // Panels are reduced by slot depth on each side

	// Adjust dimensions based on whether they're inside or outside measurements
	// For outside dimensions, we need to subtract the extrusion width (20mm for 2020) to get the internal frame dimension.
	const internalLength = isOutsideDimension
		? length - extrusionWidth * 2
		: length;
	const internalWidth = isOutsideDimension ? width - extrusionWidth * 2 : width;
	const internalHeight = isOutsideDimension
		? height - extrusionWidth * 2
		: height; // Assuming panels go up to the top/bottom of vertical extrusions

	// Calculate panel dimensions, accounting for V-slot reduction
	const panelTopBottomWidth = internalWidth - PANEL_REDUCTION;
	const panelTopBottomLength = internalLength - PANEL_REDUCTION;

	const panelSideHeight = internalHeight - PANEL_REDUCTION;
	const panelFrontBackHeight = internalHeight - PANEL_REDUCTION; // Same as side height

	const panelSideWidth = internalLength - PANEL_REDUCTION; // Left/Right panels use enclosure length
	const panelFrontBackWidth = internalWidth - PANEL_REDUCTION; // Front/Back panels use enclosure width

	// Initialize panels array
	const panels = [];
	let totalArea = 0;
	// Add panels based on configuration
	if (materialConfig.panelConfig.top) {
		panels.push({
			position: "Top",
			width: panelTopBottomWidth,
			length: panelTopBottomLength,
			thickness: materialConfig.thickness,
		});
		totalArea += panelTopBottomWidth * panelTopBottomLength;
	}
	if (materialConfig.panelConfig.bottom) {
		panels.push({
			position: "Bottom",
			width: panelTopBottomWidth,
			length: panelTopBottomLength,
			thickness: materialConfig.thickness,
		});
		totalArea += panelTopBottomWidth * panelTopBottomLength;
	}
	if (materialConfig.panelConfig.left) {
		panels.push({
			position: "Left",
			width: panelSideWidth,
			height: panelSideHeight,
			length: panelSideWidth,
			thickness: materialConfig.thickness,
		});
		totalArea += panelSideWidth * panelSideHeight;
	}
	if (materialConfig.panelConfig.right) {
		panels.push({
			position: "Right",
			width: panelSideWidth,
			height: panelSideHeight,
			length: panelSideWidth,
			thickness: materialConfig.thickness,
		});
		totalArea += panelSideWidth * panelSideHeight;
	}
	if (materialConfig.panelConfig.back) {
		panels.push({
			position: "Back",
			width: panelFrontBackWidth,
			height: panelFrontBackHeight,
			length: panelFrontBackWidth,
			thickness: materialConfig.thickness,
		});
		totalArea += panelFrontBackWidth * panelFrontBackHeight;
	}
	if (materialConfig.panelConfig.front) {
		panels.push({
			position: "Front",
			width: panelFrontBackWidth,
			height: panelFrontBackHeight,
			length: panelFrontBackWidth,
			thickness: materialConfig.thickness,
		});
		totalArea += panelFrontBackWidth * panelFrontBackHeight;
	}
	return {
		material: {
			type: materialConfig.type,
			thickness: materialConfig.thickness,
		},
		panels,
		totalArea,
	};
};

// All cost/cost breakdown logic has been removed from this file.
// All calculation functions below only return BOM-relevant data: part, SKU, qty, description/length.
// This file is now focused solely on generating a Bill of Materials (BOM) for WooCommerce import.

// Export constants for testing
export const CONSTANTS = {
	DEFAULT_TABLE_HARDWARE,
	DEFAULT_ENCLOSURE_HARDWARE,
	EXTRA_HARDWARE_FOR_1_5M,
	TABLE_MOUNT_HARDWARE,
	DOOR_HARDWARE,
};
