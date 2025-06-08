/**
 * Type definitions for the Table and Enclosure Calculator
 */

/**
 * Door types available based on Maker Store documentation
 */
export enum DoorType {
	STANDARD = "STND",
	BIFOLD = "BFLD",
	AWNING = "AWNG",
}

/**
 * Utility types for enhanced type safety
 */
export type DimensionsWithoutFlag = Omit<Dimensions, "isOutsideDimension">;
export type DimensionsRequired = Required<Dimensions>;
export type DimensionsMeasurements = Pick<
	Dimensions,
	"length" | "width" | "height"
>;
export type DoorConfigFlags = Omit<DoorConfig, "doorType">;
export type PanelPositions = keyof MaterialConfig["panelConfig"];

/**
 * Door type display names for user-friendly interface
 */
export const DoorTypeDisplayNames = {
	[DoorType.STANDARD]: "Standard",
	[DoorType.BIFOLD]: "Bi-Fold",
	[DoorType.AWNING]: "Awning",
};

/**
 * Interface for dimensions of table or enclosure
 * Includes centralized control for dimension type (inside vs outside)
 *
 * For the enclosure and table:
 * - If isOutsideDimension is true: length and width are the outside measurements of the frame
 * - If isOutsideDimension is false: length and width are the inside measurements of the frame
 * - Height is always the overall height including extrusions
 *
 * For large enclosures (≥1500mm):
 * - Top horizontal extrusions use 2040 profile
 * - Bottom horizontal extrusions use 2020 profile
 * - Vertical extrusions always use 2020 profile
 *
 * For smaller enclosures:
 * - All extrusions use 2020 profile
 */
export interface Dimensions {
	length: number;
	width: number;
	height: number;
	isOutsideDimension?: boolean; // Optional flag for backward compatibility
}

/**
 * Interface for door configuration options
 */
export interface DoorConfig {
	frontDoor: boolean;
	backDoor: boolean;
	leftDoor: boolean;
	rightDoor: boolean;
	doorType: DoorType;
}

/**
 * Interface for door panel dimensions
 */
export interface DoorPanelDimensions {
	position: string;
	width: number;
	height: number;
	notes?: string; // Optional notes field for door type specific information
}

/**
 * Interface for configuration options
 */
export interface TableConfig {
	includeTable: boolean;
	includeEnclosure: boolean;
	mountEnclosureToTable: boolean;
	includeDoors: boolean;
	doorConfig: DoorConfig;
	isOutsideDimension: boolean;
}

/**
 * Interface for material configuration
 */
export interface MaterialConfig {
	type: string;
	thickness: number;
	includePanels: boolean;
	panelConfig: {
		top: boolean;
		bottom: boolean;
		left: boolean;
		right: boolean;
		back: boolean;
		front: boolean;
	};
}

/**
 * Utility types for Material Configuration
 */
export type PanelConfig = MaterialConfig["panelConfig"];
export type MaterialConfigWithoutPanels = Omit<MaterialConfig, "panelConfig">;
export type PanelConfigPartial = Partial<PanelConfig>;

/**
 * Interface for calculation results
 */
export interface Results {
	table?: {
		extrusions: {
			rail2060Length: number;
			rail2060Width: number;
			rail4040Legs: number;
			qtyRail2060Length: number;
			qtyRail2060Width: number;
			qtyRail4040Legs: number;
		};
		hardware: {
			IOCNR_60: number;
			L_BRACKET_TRIPLE: number;
			T_NUT_SLIDING: number;
			CAP_HEAD_M5_8MM: number;
			BUTTON_HEAD_M5_8MM: number;
			LOW_PROFILE_M5_25MM: number;
			FOOT_BRACKETS: number;
			FEET: number;
		};
		totalLengths: {
			rail2060: number;
			rail4040: number;
		};
	};
	enclosure?: {
		extrusions: {
			horizontal: {
				length: {
					type: string; // Can be "2020" or "2040" depending on size
					size: number;
				};
				width: {
					type: string; // Can be "2020" or "2040" depending on size
					size: number;
				};
			};
			vertical2020: {
				size: number; // Height accounting for top/bottom extrusion heights
				qty: number; // Always 4 for standard enclosure
			};
		};
		hardware: {
			IOCNR_20: number;
			IOCNR_40: number;
			IOCNR_60: number;
			ANGLE_CORNER_90: number;
			T_NUT_SLIDING: number;
			CAP_HEAD_M5_8MM: number;
			BUTTON_HEAD_M5_8MM: number;
		};
		totalLengths: {
			rail2020: number; // Total length of 2020 extrusions for length rails
			rail2040: number; // Total length of 2040 extrusions for length rails
			railWidth2020: number; // Total length of 2020 extrusions for width rails
			railWidth2040: number; // Total length of 2040 extrusions for width rails
			verticalRail2020: number; // Total length of vertical 2020 extrusions
		};
	};
	mounting?: {
		hardware: {
			IOCNR_40: number;
			T_NUT_SLIDING: number;
			CAP_HEAD_M5_8MM: number;
		};
		instructions: string;
	};
	doors?: {
		hardware: {
			HINGE: number;
			HANDLE: number;
			T_NUT_SLIDING: number;
			BUTTON_HEAD_M5_8MM: number;
			CORNER_BRACKET: number;
			SPRING_LOADED_T_NUT: number; // Added for panel mounting
		};
		panels: Array<{
			position: string;
			width: number;
			height: number;
			notes?: string; // Optional notes field for door type specific information
		}>;
	};
	panels?: {
		material: {
			type: string;
			thickness: number;
		};
		panels: Array<{
			position: string;
			width?: number;
			height?: number;
			length?: number;
		}>;
		totalArea: number;
	};
}

/**
 * Utility types for Results
 */
export type TableResults = NonNullable<Results["table"]>;
export type EnclosureResults = NonNullable<Results["enclosure"]>;
export type DoorResults = NonNullable<Results["doors"]>;
export type PanelResults = NonNullable<Results["panels"]>;
export type ResultsPartial = Partial<Results>;

/**
 * Enhanced Event Handler Types using utility types
 */
export type FormChangeHandler = React.ChangeEvent<HTMLInputElement>;
export type SelectChangeHandler = React.ChangeEvent<HTMLSelectElement>;
export type TextAreaChangeHandler = React.ChangeEvent<HTMLTextAreaElement>;

// Generic form element change handler
export type FormElementChangeHandler<T = HTMLInputElement> =
	React.ChangeEvent<T>;

/**
 * Validation Error Types using utility types
 */
export interface ValidationErrors {
	table?: Partial<Record<keyof DimensionsMeasurements, string>>;
	enclosure?: Partial<Record<keyof DimensionsMeasurements, string>>;
	general?: string[];
}

export type ValidationErrorsPartial = Partial<ValidationErrors>;
export type DimensionValidationErrors = ValidationErrors["table"];
export type GeneralValidationErrors = NonNullable<ValidationErrors["general"]>;
