/**
 * Table calculator component
 * Updated: 02/06/2025
 * Author: Daniel Potter
 * Description: The TableCalculator component is responsible for rendering
 * the main calculator interface with comprehensive memory leak prevention.
 * This is a simplified standalone version without complex configuration management.
 *
 * MEMORY LEAK PREVENTION ARCHITECTURE:
 * This component implements several critical patterns to prevent memory leaks
 * and ensure stable performance in long-running sessions:
 *
 * 1. COMPONENT LIFECYCLE TRACKING:
 *    - Uses isMountedRef to track component mount status
 *    - All async operations check this flag before state updates
 *    - Prevents "setState on unmounted component" warnings
 *
 * 2. TIMEOUT MANAGEMENT:
 *    - timeoutRef tracks all setTimeout calls for proper cleanup
 *    - Clears existing timeouts before setting new ones
 *    - Comprehensive cleanup in useEffect return function
 *
 * 3. OPTIMIZED RE-RENDERS:
 *    - Calculation effects use comprehensive dependency arrays
 *    - useCallback for expensive operations and event handlers
 *    - Prevents unnecessary recalculations and infinite loops
 *
 * SIMPLIFIED FEATURES:
 * - Direct calculation without configuration persistence
 * - No preset system or saved configurations
 * - No undo/redo functionality
 * - Clean, straightforward user interface
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	calculateTableMaterials,
	calculateEnclosureMaterials,
	calculateMountingMaterials,
	calculateDoorMaterials,
	calculatePanelMaterials,
	CONSTANTS,
} from "../calcUtils";
import type {
	Dimensions,
	DoorConfig,
	TableConfig,
	MaterialConfig,
	Results,
} from "../../../types/box-shipping-calculator/box-shipping-types";
import { DoorType } from "../../../types/box-shipping-calculator/box-shipping-types";
import { ConfigPanel } from "./ConfigPanel";
import { ResultsPanel } from "./ResultsPanel";

// Import constants from calcUtils
const {
	DEFAULT_TABLE_HARDWARE,
	DEFAULT_ENCLOSURE_HARDWARE,
	EXTRA_HARDWARE_FOR_1_5M,
	TABLE_MOUNT_HARDWARE,
	DOOR_HARDWARE,
} = CONSTANTS;

// Import utility types for enhanced type safety
import type {
	DimensionsWithoutFlag,
	ValidationErrors,
	DimensionsMeasurements,
	FormElementChangeHandler,
} from "@/types/box-shipping-calculator/box-shipping-types";

/**
 * TableCalculator component
 * This component handles the table and enclosure calculator logic,
 * including state management, calculations, and rendering.
 *
 * @param {Array} materialTypes - Array of material types for selection
 * @param {number} materialThickness - Fixed material thickness for calculations
 */
interface TableCalculatorProps {
	materialTypes: Array<{
		id: string;
		name: string;
	}>;
	materialThickness: number;
}

/**
 * The table calculator component.
 * Enhanced with input validation, error handling, and user experience improvements.
 * @param materialTypes - Array of material types for selection
 * @param materialThickness - Fixed material thickness for calculations
 */
export default function TableCalculator({
	materialTypes,
	materialThickness,
}: TableCalculatorProps) {
	const printRef = useRef<HTMLDivElement>(null);
	// Ref to track if component is mounted (prevents memory leaks)
	// This is crucial for preventing "setState on unmounted component" warnings
	// and ensures async operations don't execute after component cleanup.
	// MEMORY LEAK PREVENTION: This pattern prevents one of the most common
	// React memory leaks where async operations continue after unmount.
	const isMountedRef = useRef(true);

	// Ref to store timeout IDs for cleanup (prevents memory leaks)
	// Tracks all setTimeout calls to ensure proper cleanup on component unmount
	// or when new timeouts need to replace existing ones.
	// MEMORY LEAK PREVENTION: Untracked timeouts are a major source of memory
	// leaks in React components, especially with frequent state updates.
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// State for table dimensions
	const [tableDimensions, setTableDimensions] = useState<
		Omit<Dimensions, "isOutsideDimension">
	>({
		length: 1000,
		width: 1000,
		height: 800,
	});

	// State for enclosure dimensions
	const [enclosureDimensions, setEnclosureDimensions] = useState<
		Omit<Dimensions, "isOutsideDimension">
	>({
		length: 1000,
		width: 1000,
		height: 1000,
	});
	// Material configuration for panels and doors
	const [materialConfig, setMaterialConfig] = useState<MaterialConfig>({
		type: materialTypes[0].id,
		thickness: materialThickness,
		includePanels: false,
		panelConfig: {
			top: false,
			bottom: false,
			left: false,
			right: false,
			back: false,
			front: false, // ensure front is part of the initial state
		},
	});

	const [config, setConfig] = useState<TableConfig>({
		includeTable: true,
		includeEnclosure: false,
		mountEnclosureToTable: false,
		includeDoors: false,
		isOutsideDimension: true, // Centralized control for dimension type
		doorConfig: {
			frontDoor: false,
			backDoor: false,
			leftDoor: false,
			rightDoor: false,
			doorType: DoorType.STANDARD,
		},
	});
	// Calculation results
	const [results, setResults] = useState<Results>({});
	// Basic state for calculator functionality
	const [isCalculating, setIsCalculating] = useState(false);
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{}
	);
	const [showTooltips, setShowTooltips] = useState(false);

	// CRITICAL MEMORY LEAK PREVENTION: Cleanup effect to prevent memory leaks
	// This effect runs on component unmount and is essential for:
	// 1. Setting the mounted flag to false to prevent async operations
	// 2. Clearing any pending timeouts that could cause memory leaks
	// 3. Ensuring no lingering references that prevent garbage collection
	useEffect(() => {
		return () => {
			// Mark component as unmounted to prevent async state updates
			isMountedRef.current = false;

			// Clear any pending timeouts to prevent memory leaks
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, []); // Load state from URL parameters on mount
	useEffect(() => {
		// No URL parameter loading - use default values
	}, []);

	const materialTypesMap = materialTypes.reduce((acc, curr) => {
		acc[curr.id] = curr;
		return acc;
	}, {} as Record<string, any>);
	const getRecommendedEnclosureSize = useCallback(
		(
			tableDim: Omit<Dimensions, "isOutsideDimension">,
			enclosureHeight: number,
			isOutsideDim: boolean
		): Omit<Dimensions, "isOutsideDimension"> => {
			/**
			 * Logic to calculate recommended enclosure size based on table dimensions
			 * The length and width of the enclosure should be slightly larger than the table
			 * When isOutsideDim is true (outside dimensions), we add a 20mm margin around the table
			 * This provides a clean alignment with the table's outside edge while ensuring proper fit
			 */
			const adjustment = isOutsideDim ? 20 : 0; // Adjustment for length/width based on dimension type

			/**
			 * Height adjustment for enclosure when mounted on a table
			 * For a 200mm enclosure height mounted on a 700mm table, the total height would be 900mm
			 * However, with 20mm horizontal rails at top and bottom (40mm total), this would add to 940mm
			 * By subtracting 40mm from the user-specified enclosure height, we get rails of 160mm length
			 * When the 40mm horizontal rail height is added, the final enclosure height becomes 200mm as specified
			 */
			const adjustedHeight = enclosureHeight - 40; // Subtract 40mm for horizontal rails (20mm top + 20mm bottom)

			return {
				length: tableDim.length + adjustment,
				width: tableDim.width + adjustment,
				height: adjustedHeight > 0 ? adjustedHeight : enclosureHeight, // Safety check to avoid negative height
			};
		},
		[]
	);

	/**
	 * Updates enclosure dimensions based on table dimensions if a table is included.
	 * Maintains the height from the current enclosure settings.
	 */ const updateEnclosureDimensionsFromTable = useCallback(
		(
			tableDims: Omit<Dimensions, "isOutsideDimension">,
			currentEnclosureHeight: number,
			isOutsideDim: boolean
		) => {
			// Only update if we're actually including a table
			// This check is now done with the parameter, not the state
			const recommended = getRecommendedEnclosureSize(
				tableDims,
				currentEnclosureHeight,
				isOutsideDim
			);
			setEnclosureDimensions(recommended);
		},
		[getRecommendedEnclosureSize]
	);
	/**
	 * Handle table dimension changes
	 * Converts mm inputs to numeric values
	 * If a table and enclosure are included, also updates enclosure dimensions
	 */
	const handleTableDimensionChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const { name, value, type, checked } = e.target;
		const val = type === "checkbox" ? checked : parseInt(value) || 0;

		setTableDimensions((prev) => {
			const newDims = { ...prev, [name]: val };

			// Validate new dimensions
			const errors = validateTableDimensions(newDims);
			setValidationErrors((current) => ({
				...current,
				table: errors,
			}));

			// If table and enclosure are included, update enclosure dimensions
			if (config.includeTable && config.includeEnclosure) {
				// Clear any existing timeout to prevent memory leaks
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				// Use a timeout to batch the update and prevent infinite loops
				timeoutRef.current = setTimeout(() => {
					if (isMountedRef.current) {
						updateEnclosureDimensionsFromTable(
							newDims,
							enclosureDimensions.height,
							config.isOutsideDimension
						);
					}
				}, 0);
			}

			return newDims;
		});
	};
	/**
	 * Handle enclosure dimension changes
	 * Converts mm inputs to numeric values
	 * This is primarily for height, as L/W are auto-adjusted if a table is present.
	 */
	const handleEnclosureDimensionChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const { name, value, type, checked } = e.target;
		const val = type === "checkbox" ? checked : parseInt(value) || 0;

		setEnclosureDimensions((prev) => {
			const newDims = { ...prev, [name]: val };

			// Validate new dimensions
			const errors = validateEnclosureDimensions(newDims);
			setValidationErrors((current) => ({
				...current,
				enclosure: errors,
			}));
			return newDims;
		});
		// If table is not included, L/W changes are manual. If table IS included, L/W are derived.
		// Height is always manual for enclosure.
	};
	/**
	 * Handle material type change
	 */
	const handleMaterialTypeChange = (
		e: React.ChangeEvent<HTMLSelectElement>
	) => {
		const newMaterialConfig = {
			...materialConfig,
			type: e.target.value,
		};
		setMaterialConfig(newMaterialConfig);
	};

	// Removed handleMaterialThicknessChange as thickness is fixed

	/**
	 * Handle panel configuration changes (e.g., which panels to include)
	 */
	const handlePanelConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;

		// Special handling for includePanels checkbox
		if (name === "includePanels") {
			const newMaterialConfig = {
				...materialConfig,
				includePanels: checked,
			};
			setMaterialConfig(newMaterialConfig);
		} else {
			// Handle specific panel configurations
			const newMaterialConfig = {
				...materialConfig,
				panelConfig: {
					...materialConfig.panelConfig,
					[name]: checked,
				},
			};
			setMaterialConfig(newMaterialConfig);
		}
	};
	const handleDoorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { value } = e.target;
		const newConfig = {
			...config,
			doorConfig: {
				...config.doorConfig,
				doorType: value as DoorType,
			},
		};
		setConfig(newConfig);
	};
	const printBOM = () => {
		if (!printRef.current) return;

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const printContents = printRef.current.innerHTML;
		printWindow.document.write(`
			<html>
				<head>
					<title>Bill of Materials</title>
					<style>
						body { font-family: Arial, sans-serif; }
						table { border-collapse: collapse; width: 100%; }
						th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
						th { background-color: #f2f2f2; }
					</style>
				</head>
				<body>
					${printContents}
				</body>
			</html>
		`);
		printWindow.document.close();
		printWindow.print();
		printWindow.close();
	}; // Removed duplicated useEffect for handling searchParams
	// We already have the parameters loading in the first useEffect

	/**
	 * VALIDATION FUNCTIONS
	 * These functions validate user inputs and provide helpful error messages
	 */

	/**
	 * Validates table dimensions and returns error messages
	 */
	const validateTableDimensions = useCallback(
		(dims: Omit<Dimensions, "isOutsideDimension">) => {
			const errors: { length?: string; width?: string; height?: string } = {};

			// Length validation
			if (dims.length < 100) {
				errors.length = "Table length must be at least 100mm";
			} else if (dims.length > 5000) {
				errors.length =
					"Table length should not exceed 5000mm for practical purposes";
			}

			// Width validation
			if (dims.width < 100) {
				errors.width = "Table width must be at least 100mm";
			} else if (dims.width > 5000) {
				errors.width =
					"Table width should not exceed 5000mm for practical purposes";
			}

			// Height validation
			if (dims.height < 200) {
				errors.height = "Table height must be at least 200mm";
			} else if (dims.height > 2000) {
				errors.height =
					"Table height should not exceed 2000mm for practical purposes";
			}

			return errors;
		},
		[]
	);

	/**
	 * Validates enclosure dimensions and returns error messages
	 */
	const validateEnclosureDimensions = useCallback(
		(dims: Omit<Dimensions, "isOutsideDimension">) => {
			const errors: { length?: string; width?: string; height?: string } = {};

			// Length validation
			if (dims.length < 100) {
				errors.length = "Enclosure length must be at least 100mm";
			} else if (dims.length > 5000) {
				errors.length =
					"Enclosure length should not exceed 5000mm for practical purposes";
			}

			// Width validation
			if (dims.width < 100) {
				errors.width = "Enclosure width must be at least 100mm";
			} else if (dims.width > 5000) {
				errors.width =
					"Enclosure width should not exceed 5000mm for practical purposes";
			}

			// Height validation
			if (dims.height < 50) {
				errors.height = "Enclosure height must be at least 50mm";
			} else if (dims.height > 2000) {
				errors.height =
					"Enclosure height should not exceed 2000mm for practical purposes";
			}

			return errors;
		},
		[]
	);

	/**
	 * Validates the entire configuration and returns consolidated errors
	 */
	const validateConfiguration = useCallback(() => {
		const errors: ValidationErrors = { general: [] };

		if (config.includeTable) {
			const tableErrors = validateTableDimensions(tableDimensions);
			if (Object.keys(tableErrors).length > 0) {
				errors.table = tableErrors;
			}
		}

		if (config.includeEnclosure) {
			const enclosureErrors = validateEnclosureDimensions(enclosureDimensions);
			if (Object.keys(enclosureErrors).length > 0) {
				errors.enclosure = enclosureErrors;
			}
		}

		// General validation rules
		if (!config.includeTable && !config.includeEnclosure) {
			errors.general?.push(
				"Please select at least one component (Table or Enclosure)"
			);
		}

		if (
			config.mountEnclosureToTable &&
			(!config.includeTable || !config.includeEnclosure)
		) {
			errors.general?.push(
				"Both table and enclosure must be included to mount enclosure to table"
			);
		}

		if (config.includeDoors && !config.includeEnclosure) {
			errors.general?.push("Enclosure must be included to add doors");
		}

		if (materialConfig.includePanels && !config.includeEnclosure) {
			errors.general?.push("Enclosure must be included to add panels");
		}

		return errors;
	}, [
		config,
		tableDimensions,
		enclosureDimensions,
		materialConfig,
		validateTableDimensions,
		validateEnclosureDimensions,
	]);

	/**
	 * ENHANCED CALCULATION EFFECT
	 * Added validation and loading states for better user experience
	 */
	useEffect(() => {
		if (!isMountedRef.current) return;

		// Validate configuration before calculating
		const errors = validateConfiguration();
		setValidationErrors(errors);

		// Only calculate if there are no validation errors
		const hasErrors =
			Object.keys(errors.table || {}).length > 0 ||
			Object.keys(errors.enclosure || {}).length > 0 ||
			(errors.general && errors.general.length > 0);

		if (hasErrors) {
			setResults({});
			return;
		}

		// Show loading state for complex calculations
		setIsCalculating(true);

		// Use a small delay to show loading state and prevent blocking
		const calculateTimeout = setTimeout(() => {
			if (!isMountedRef.current) return;

			try {
				// Calculate all results based on current dimensions and config
				const tableResults = config.includeTable
					? calculateTableMaterials(tableDimensions, config.isOutsideDimension)
					: undefined;

				const enclosureResults = config.includeEnclosure
					? calculateEnclosureMaterials(
							enclosureDimensions,
							config.isOutsideDimension
					  )
					: undefined;

				const mountingResults =
					config.includeTable &&
					config.includeEnclosure &&
					config.mountEnclosureToTable
						? calculateMountingMaterials()
						: undefined;

				const doorResults =
					config.includeEnclosure && config.includeDoors
						? calculateDoorMaterials(
								enclosureDimensions,
								config.isOutsideDimension,
								config.doorConfig
						  )
						: undefined;

				const panelResults =
					config.includeEnclosure && materialConfig.includePanels
						? calculatePanelMaterials(
								enclosureDimensions,
								config.isOutsideDimension,
								materialConfig
						  )
						: undefined;

				setResults({
					table: tableResults,
					enclosure: enclosureResults,
					mounting: mountingResults,
					doors: doorResults,
					panels: panelResults,
				});
			} catch (error) {
				console.error("Calculation error:", error);
				setValidationErrors({
					general: [
						"An error occurred during calculation. Please check your inputs.",
					],
				});
			} finally {
				setIsCalculating(false);
			}
		}, 100);

		return () => {
			clearTimeout(calculateTimeout);
		};
	}, [
		config.includeTable,
		config.includeEnclosure,
		config.mountEnclosureToTable,
		config.includeDoors,
		config.isOutsideDimension,
		config.doorConfig.frontDoor,
		config.doorConfig.backDoor,
		config.doorConfig.leftDoor,
		config.doorConfig.rightDoor,
		config.doorConfig.doorType,
		tableDimensions.length,
		tableDimensions.width,
		tableDimensions.height,
		enclosureDimensions.length,
		enclosureDimensions.width,
		enclosureDimensions.height,
		materialConfig.type,
		materialConfig.thickness,
		materialConfig.includePanels,
		materialConfig.panelConfig.top,
		materialConfig.panelConfig.bottom,
		materialConfig.panelConfig.left,
		materialConfig.panelConfig.right,
		materialConfig.panelConfig.back,
		materialConfig.panelConfig.front,
		validateConfiguration,
	]);

	/**
	 * Handle configuration changes
	 */
	const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, type, checked } = e.target;
		const value = type === "checkbox" ? checked : e.target.value;

		// Handle nested properties like doorConfig.frontDoor
		if (name.includes(".")) {
			const [parentKey, childKey] = name.split(".");
			if (parentKey === "doorConfig") {
				const newConfig = {
					...config,
					doorConfig: {
						...config.doorConfig,
						[childKey]: value,
					},
				};
				setConfig(newConfig);
			}
		} else {
			const newConfig = {
				...config,
				[name]: value,
			};
			setConfig(newConfig);
		}
	};

	/**
	 * UI/UX IMPROVEMENT: Show a prominent message if no calculation is performed
	 * This helps users understand why the BOM/results are not visible.
	 * Calculation is only performed if at least one component (Table or Enclosure) is enabled and dimensions are valid.
	 */
	const showNoCalculationMessage =
		!config.includeTable && !config.includeEnclosure;

	return (
		<div className="container mt-0">
			{/* Simplified header */}
			<div className="d-flex justify-content-between align-items-center mb-4">
				<div>
					<h1 className="h3 mb-0">Table and Enclosure Calculator</h1>
					<small className="text-muted">
						Configure your CNC table and enclosure specifications
					</small>
				</div>
				<div className="btn-group">
					<button
						type="button"
						className="btn btn-outline-secondary btn-sm"
						onClick={() => setShowTooltips(!showTooltips)}
						title={showTooltips ? "Hide help tooltips" : "Show help tooltips"}
					>
						{showTooltips ? "Hide Help" : "Show Help"}
					</button>
				</div>
			</div>

			{/* Show a message if no calculation is being performed */}
			{showNoCalculationMessage && (
				<div className="alert alert-info mb-4">
					Please select at least one component (Table or Enclosure) and enter
					valid dimensions to see the Bill of Materials.
				</div>
			)}

			{/* Global validation errors */}
			{validationErrors.general && validationErrors.general.length > 0 && (
				<div className="alert alert-warning mb-4">
					<h6>Configuration Issues:</h6>
					<ul className="mb-0">
						{validationErrors.general.map((error, index) => (
							<li key={index}>{error}</li>
						))}
					</ul>
				</div>
			)}

			{/*
				ConfigPanel handles all user input for table/enclosure/panel/door config.
				ResultsPanel displays the calculated BOM and cost breakdown if results are available.
			*/}
			<ConfigPanel
				config={config}
				tableDimensions={tableDimensions}
				enclosureDimensions={enclosureDimensions}
				materialConfig={materialConfig}
				handleConfigChange={handleConfigChange}
				handleTableDimensionChange={handleTableDimensionChange}
				handleEnclosureDimensionChange={handleEnclosureDimensionChange}
				handlePanelConfigChange={handlePanelConfigChange}
				handleMaterialTypeChange={handleMaterialTypeChange}
				handleDoorTypeChange={handleDoorTypeChange}
				MATERIAL_TYPES={materialTypes}
				MATERIAL_THICKNESS={materialThickness}
				validationErrors={validationErrors}
				showTooltips={showTooltips}
			/>
			<ResultsPanel
				results={results}
				config={config}
				materialConfig={materialConfig}
				tableDimensions={tableDimensions}
				enclosureDimensions={enclosureDimensions}
				materialTypesMap={materialTypesMap}
				isCalculating={isCalculating}
			/>
		</div>
	);
}
// This component is now focused solely on generating a Bill of Materials (BOM) for WooCommerce import.
// All cost/cost breakdown UI, logic, and comments have been removed.
// No functional changes were made, only documentation and code clarity improvements.
