/**
 * Table and Enclosure Calculator Constants
 * Updated: 17/05/2025
 * Author: Deej Potter
 *
 * Constants for the Table and Enclosure Calculator
 */

/**
 * Material types and their properties
 */

// Material types interface
export interface MaterialType {
	id: string;
	name: string;
	sku: string;
}

export const MATERIAL_TYPES = [
	{
		id: "corflute-clear-6mm",
		name: "Clear Corflute Sheets - 6mm",
		sku: "MAT-CFLU-6-C-240X120",
	},
	{
		id: "corflute-black-6mm",
		name: "Black Corflute Sheets - 6mm",
		sku: "MAT-CFLU-6-B-240X120",
	},
	{
		id: "polypropylene-bubble-6mm",
		name: "Heavy Duty Polypropylene Bubble Board - 6mm - Black",
		sku: "MAT-BUBL-6-G-240X120",
	},
];

// Standard material thicknesses in mm - Now a single fixed value
export const MATERIAL_THICKNESS = 6;

/**
 * Extrusion dimensions.
 */

// Dimensions interface for extrusions
export interface ExtrusionDimensions {
	id: string;
	name: string;
	sku: string;
	width: number;
	height: number;
	length: number;
	colour: string;
	slotDepth: number;
	slotWidth: number;
}

export const EXTRUSION_OPTIONS: ExtrusionDimensions[] = [
	{
		id: "20x20-20",
		name: "20mm x 20mm - 20 series",
		sku: "LR-2020-S-1",
		width: 20,
		height: 20,
		length: 1,
		colour: "Silver",
		slotDepth: 6,
		slotWidth: 6,
	},
	{
		id: "20x40-20",
		name: "20mm x 40mm - 20 series",
		sku: "LR-2040-S-1",
		width: 20,
		height: 40,
		length: 1,
		colour: "Silver",
		slotDepth: 6,
		slotWidth: 6,
	},
	{
		id: "40x40-20",
		name: "40mm x 40mm - 20 series",
		sku: "LR-4040-S-1",
		width: 40,
		height: 40,
		length: 1,
		colour: "Silver",
		slotDepth: 6,
		slotWidth: 6,
	},
	{
		id: "40x40-40",
		name: "40mm x 40mm - 40 series",
		sku: "LR-40S-4040-S-1",
		width: 40,
		height: 40,
		length: 1,
		colour: "Silver",
		slotDepth: 10,
		slotWidth: 8,
	},
	{
		id: "40x80-40",
		name: "40mm x 80mm - 40 series",
		sku: "LR-40S-4080-S-1",
		width: 40,
		height: 80,
		length: 1,
		colour: "Silver",
		slotDepth: 10,
		slotWidth: 8,
	},
];
