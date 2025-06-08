/**
 * Config panel component
 * Updated: 17/05/2025
 * Author: Daniel Potter
 * Description: This component handles the configuration of the table and enclosure calculator.
 * It holds the state and interfaces for the configuration options panel that controls most of the configurable options for the table and enclosure.
 * The sizes for the table and enclosure are passed in as props and they come from the table and enclosure panels.
 */

"use client";
import React from "react";
import type {
	Dimensions,
	TableConfig,
	MaterialConfig,
	DoorConfig,
	DimensionsWithoutFlag,
	ValidationErrors,
	PanelPositions,
	DoorConfigFlags,
} from "@/types/box-shipping-calculator/box-shipping-types";
import {
	DoorType,
	DoorTypeDisplayNames,
} from "@/types/box-shipping-calculator/box-shipping-types";

/**
 * The props for the ConfigPanel component using enhanced utility types.
 * @property {TableConfig} config - The configuration object for the table and enclosure.
 * @property {DimensionsWithoutFlag} tableDimensions - The dimensions of the table.
 * @property {DimensionsWithoutFlag} enclosureDimensions - The dimensions of the enclosure.
 * @property {MaterialConfig} materialConfig - The material configuration object.
 * @property {function} handleConfigChange - Function to handle changes in the configuration.
 * @property {function} handleTableDimensionChange - Function to handle changes in table dimensions.
 * @property {function} handleEnclosureDimensionChange - Function to handle changes in enclosure dimensions.
 */
interface ConfigPanelProps {
	config: TableConfig;
	tableDimensions: DimensionsWithoutFlag;
	enclosureDimensions: DimensionsWithoutFlag;
	materialConfig: MaterialConfig;
	handleConfigChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleTableDimensionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleEnclosureDimensionChange: (
		e: React.ChangeEvent<HTMLInputElement>
	) => void;
	handlePanelConfigChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleMaterialTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	handleDoorTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	MATERIAL_TYPES: Array<{ id: string; name: string }>;
	MATERIAL_THICKNESS: number;
	validationErrors?: ValidationErrors;
	showTooltips?: boolean;
}

/**
 * Client component for configuration options
 */
export function ConfigPanel({
	config,
	tableDimensions,
	enclosureDimensions,
	materialConfig,
	handleConfigChange,
	handleTableDimensionChange,
	handleEnclosureDimensionChange,
	handlePanelConfigChange,
	handleMaterialTypeChange,
	handleDoorTypeChange,
	MATERIAL_TYPES,
	MATERIAL_THICKNESS,
	validationErrors,
	showTooltips,
}: ConfigPanelProps) {
	return (
		<>
			{/* Configuration Options */}
			<div className="card mb-4">
				<div className="card-header">
					<h2 className="h5 mb-0">Configuration</h2>
				</div>
				<div className="card-body">
					{" "}
					<div className="row g-3">
						<div className="col-md-4">
							<div className="form-check form-switch">
								<input
									className="form-check-input"
									type="checkbox"
									role="switch"
									id="includeTable"
									name="includeTable"
									checked={config.includeTable}
									onChange={handleConfigChange}
								/>
								<label className="form-check-label" htmlFor="includeTable">
									Include Table
									{showTooltips && (
										<small className="text-muted d-block">
											Calculate materials for a CNC table structure with
											aluminum extrusions
										</small>
									)}
								</label>
							</div>
						</div>{" "}
						<div className="col-md-4">
							<div className="form-check form-switch">
								<input
									className="form-check-input"
									type="checkbox"
									role="switch"
									id="includeEnclosure"
									name="includeEnclosure"
									checked={config.includeEnclosure}
									onChange={handleConfigChange}
								/>
								<label className="form-check-label" htmlFor="includeEnclosure">
									Include Enclosure
									{showTooltips && (
										<small className="text-muted d-block">
											Calculate materials for an aluminum frame enclosure around
											your CNC
										</small>
									)}
								</label>
							</div>
						</div>{" "}
						{/* Moved "Use Outside Dimensions" here */}{" "}
						<div className="col-md-4">
							<div className="form-check form-switch">
								<input
									className="form-check-input"
									type="checkbox"
									role="switch"
									id="isOutsideDimension"
									name="isOutsideDimension"
									checked={config.isOutsideDimension}
									onChange={handleConfigChange}
								/>
								<label
									className="form-check-label"
									htmlFor="isOutsideDimension"
								>
									Use Outside Dimensions
									{showTooltips && (
										<small className="text-muted d-block">
											When enabled, dimensions represent the outer measurements.
											When disabled, dimensions represent the inner working
											area.
										</small>
									)}
								</label>
							</div>
						</div>
						{config.includeTable && config.includeEnclosure && (
							<div className="col-md-4">
								<div className="form-check form-switch">
									<input
										className="form-check-input"
										type="checkbox"
										id="mountEnclosureToTable"
										name="mountEnclosureToTable" // Handled by handleConfigChange
										checked={config.mountEnclosureToTable}
										onChange={handleConfigChange}
									/>{" "}
									<label
										className="form-check-label"
										htmlFor="mountEnclosureToTable"
									>
										Mount Enclosure to Table
										{showTooltips && (
											<small className="text-muted d-block">
												Calculate brackets and hardware to mount the enclosure
												directly to the table frame
											</small>
										)}
									</label>
								</div>
							</div>
						)}
						{config.includeEnclosure && (
							<div className="col-md-4">
								<div className="form-check form-switch">
									<input
										className="form-check-input"
										type="checkbox"
										id="includeDoors"
										name="includeDoors" // Handled by handleConfigChange
										checked={config.includeDoors}
										onChange={handleConfigChange}
									/>{" "}
									<label className="form-check-label" htmlFor="includeDoors">
										Include Doors
										{showTooltips && (
											<small className="text-muted d-block">
												Add hinged doors to the enclosure for access. Select
												positions and door type below.
											</small>
										)}
									</label>
								</div>
							</div>
						)}
						{config.includeEnclosure && config.includeDoors && (
							<>
								<div className="col-md-4">
									<label htmlFor="doorType" className="form-label">
										Door Type
									</label>
									<select
										className="form-select"
										id="doorType"
										name="doorConfig.doorType" // Special handling in handleConfigChange or use handleDoorTypeChange
										value={config.doorConfig.doorType}
										onChange={handleDoorTypeChange}
									>
										{Object.values(DoorType).map((type) => (
											<option key={type} value={type}>
												{DoorTypeDisplayNames[type]}
											</option>
										))}
									</select>
								</div>
								<div className="col-12">
									<label className="form-label">Door Positions:</label>
									<div className="d-flex flex-wrap">
										{(Object.keys(config.doorConfig) as Array<keyof DoorConfig>)
											.filter((key) => key !== "doorType") // Exclude doorType from checkboxes
											.map((key) => {
												const pos = key.replace("Door", ""); // e.g. frontDoor -> front
												const capitalizedPos =
													pos.charAt(0).toUpperCase() + pos.slice(1);
												return (
													<div className="form-check me-3" key={key}>
														<input
															className="form-check-input"
															type="checkbox"
															id={`doorConfig${capitalizedPos}Door`}
															name={`doorConfig.${key}`} // e.g., doorConfig.frontDoor
															checked={config.doorConfig[key] as boolean} // Assert as boolean
															onChange={handleConfigChange} // General handler should work for doorConfig.key
														/>
														<label
															className="form-check-label"
															htmlFor={`doorConfig${capitalizedPos}Door`}
														>
															{capitalizedPos} Door
														</label>
													</div>
												);
											})}
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>{" "}
			{/* Table Dimensions */}
			{config.includeTable && (
				<div className="card mb-4">
					<div className="card-header">
						<h2 className="h5 mb-0">
							Table Dimensions (mm)
							{showTooltips && (
								<small className="text-muted d-block">
									Enter the size of your CNC table. These dimensions will
									determine the amount of aluminum extrusions and hardware
									needed.
								</small>
							)}
						</h2>
					</div>
					<div className="card-body">
						{" "}
						<div className="row g-3">
							{" "}
							<div className="col-md-3 col-sm-6">
								<label htmlFor="tableLength" className="form-label">
									Length (mm)
									{showTooltips && (
										<small className="text-muted d-block">
											The front-to-back measurement of your table
										</small>
									)}
								</label>
								<input
									type="number"
									className="form-control"
									id="tableLength"
									name="length"
									value={tableDimensions.length}
									onChange={handleTableDimensionChange}
									min="0"
								/>
								{validationErrors?.table?.length && (
									<div className="text-danger small mt-1">
										{validationErrors.table.length}
									</div>
								)}
							</div>{" "}
							<div className="col-md-3 col-sm-6">
								<label htmlFor="tableWidth" className="form-label">
									Width (mm)
									{showTooltips && (
										<small className="text-muted d-block">
											The left-to-right measurement of your table
										</small>
									)}
								</label>
								<input
									type="number"
									className="form-control"
									id="tableWidth"
									name="width"
									value={tableDimensions.width}
									onChange={handleTableDimensionChange}
									min="0"
								/>
								{validationErrors?.table?.width && (
									<div className="text-danger small mt-1">
										{validationErrors.table.width}
									</div>
								)}
							</div>{" "}
							<div className="col-md-3 col-sm-6">
								<label htmlFor="tableHeight" className="form-label">
									Height (mm)
									{showTooltips && (
										<small className="text-muted d-block">
											The height from floor to table surface
										</small>
									)}
								</label>
								<input
									type="number"
									className="form-control"
									id="tableHeight"
									name="height"
									value={tableDimensions.height}
									onChange={handleTableDimensionChange}
									min="0"
								/>
								{validationErrors?.table?.height && (
									<div className="text-danger small mt-1">
										{validationErrors.table.height}
									</div>
								)}
							</div>
							{/* Removed individual isOutsideDimension checkbox for table */}
						</div>
						{/* Show validation errors if any */}
						{validationErrors?.table &&
							Object.keys(validationErrors.table).length > 0 && (
								<div className="alert alert-danger">
									<strong>Table dimension errors:</strong>
									<ul className="mb-0 mt-2">
										{Object.entries(validationErrors.table).map(
											([field, error]) => (
												<li key={field}>
													{field}: {error}
												</li>
											)
										)}
									</ul>
								</div>
							)}
					</div>
				</div>
			)}{" "}
			{/* Enclosure Dimensions */}
			{config.includeEnclosure && (
				<div className="card mb-4">
					<div className="card-header">
						<h2 className="h5 mb-0">
							Enclosure Dimensions (mm)
							{showTooltips && (
								<small className="text-muted d-block">
									Enter the size of your enclosure. If a table is included,
									length and width will auto-adjust to fit the table.
								</small>
							)}
						</h2>
						{config.includeTable && (
							<small className="text-muted ms-2">
								(Length & Width auto-adjusted if table is included)
							</small>
						)}
					</div>
					<div className="card-body">
						<div className="row g-3">
							{" "}
							<div className="col-md-3 col-sm-6">
								<label htmlFor="enclosureLength" className="form-label">
									Length (mm)
									{showTooltips && (
										<small className="text-muted d-block">
											{config.includeTable
												? "Auto-calculated from table size"
												: "The front-to-back measurement of your enclosure"}
										</small>
									)}
								</label>
								<input
									type="number"
									className="form-control"
									id="enclosureLength"
									name="length"
									value={enclosureDimensions.length}
									onChange={handleEnclosureDimensionChange}
									min="0"
									disabled={config.includeTable} // Disabled if table dictates size
								/>
								{validationErrors?.enclosure?.length && (
									<div className="text-danger small mt-1">
										{validationErrors.enclosure.length}
									</div>
								)}
							</div>{" "}
							<div className="col-md-3 col-sm-6">
								<label htmlFor="enclosureWidth" className="form-label">
									Width (mm)
									{showTooltips && (
										<small className="text-muted d-block">
											{config.includeTable
												? "Auto-calculated from table size"
												: "The left-to-right measurement of your enclosure"}
										</small>
									)}
								</label>
								<input
									type="number"
									className="form-control"
									id="enclosureWidth"
									name="width"
									value={enclosureDimensions.width}
									onChange={handleEnclosureDimensionChange}
									min="0"
									disabled={config.includeTable} // Disabled if table dictates size
								/>
								{validationErrors?.enclosure?.width && (
									<div className="text-danger small mt-1">
										{validationErrors.enclosure.width}
									</div>
								)}
							</div>{" "}
							<div className="col-md-3 col-sm-6">
								<label htmlFor="enclosureHeight" className="form-label">
									Height (mm)
									{showTooltips && (
										<small className="text-muted d-block">
											The height of the enclosure frame (working height inside)
										</small>
									)}
								</label>
								<input
									type="number"
									className="form-control"
									id="enclosureHeight"
									name="height"
									value={enclosureDimensions.height}
									onChange={handleEnclosureDimensionChange}
									min="0"
								/>
								{validationErrors?.enclosure?.height && (
									<div className="text-danger small mt-1">
										{validationErrors.enclosure.height}
									</div>
								)}
							</div>
							{/* Removed individual isOutsideDimension checkbox for enclosure */}
						</div>
						{/* Show validation errors if any */}
						{validationErrors?.enclosure &&
							Object.keys(validationErrors.enclosure).length > 0 && (
								<div className="alert alert-danger">
									<strong>Enclosure dimension errors:</strong>
									<ul className="mb-0 mt-2">
										{Object.entries(validationErrors.enclosure).map(
											([field, error]) => (
												<li key={field}>
													{field}: {error}
												</li>
											)
										)}
									</ul>
								</div>
							)}
					</div>
				</div>
			)}{" "}
			{/* Material Configuration */}
			{config.includeEnclosure && (
				<div className="card mb-4">
					<div className="card-header">
						<h2 className="h5 mb-0">
							Panel Materials
							{showTooltips && (
								<small className="text-muted d-block">
									Configure materials for enclosure panels (walls, top, bottom).
									Panels provide enclosure and noise reduction.
								</small>
							)}
						</h2>
					</div>{" "}
					<div className="card-body">
						<div className="row mb-3">
							<div className="col-md-6">
								<div className="form-check form-switch mb-3">
									<input
										className="form-check-input"
										type="checkbox"
										role="switch"
										id="includePanels"
										name="includePanels"
										checked={materialConfig.includePanels}
										onChange={handlePanelConfigChange}
									/>
									<label className="form-check-label" htmlFor="includePanels">
										Include Panels
										{showTooltips && (
											<small className="text-muted d-block">
												Add material panels to enclose the frame. Panels provide
												dust containment and noise reduction.
											</small>
										)}
									</label>
								</div>
							</div>
						</div>

						{materialConfig.includePanels && (
							<div className="row mb-3">
								<div className="col-md-6">
									<label htmlFor="materialType" className="form-label">
										Material Type (All {MATERIAL_THICKNESS}mm Thick)
										{showTooltips && (
											<small className="text-muted d-block">
												Choose the material for your panels. Different materials
												provide varying levels of noise reduction and
												durability.
											</small>
										)}
									</label>
									<select
										className="form-select"
										id="materialType"
										value={materialConfig.type}
										onChange={handleMaterialTypeChange}
									>
										{MATERIAL_TYPES.map((type) => (
											<option key={type.id} value={type.id}>
												{type.name}
											</option>
										))}
									</select>
								</div>
								{/* Removed Material Thickness dropdown */}
							</div>
						)}

						{materialConfig.includePanels && (
							<div>
								<label className="form-label">Panel Positions:</label>
								<div className="d-flex flex-wrap">
									{(
										Object.keys(materialConfig.panelConfig) as Array<
											keyof MaterialConfig["panelConfig"]
										>
									).map((key) => {
										const pos = key.charAt(0).toUpperCase() + key.slice(1);
										return (
											<div className="form-check me-3" key={key}>
												<input
													className="form-check-input"
													type="checkbox"
													id={`panelConfig${pos}`}
													name={key} // e.g. top, bottom, left - handled by handlePanelConfigChange
													checked={materialConfig.panelConfig[key]}
													onChange={handlePanelConfigChange}
													// Disable front panel if front door is included
													disabled={
														key === "front" &&
														config.includeDoors &&
														config.doorConfig.frontDoor
													}
												/>
												<label
													className="form-check-label"
													htmlFor={`panelConfig${pos}`}
												>
													{pos}
													{key === "front" &&
														config.includeDoors &&
														config.doorConfig.frontDoor &&
														" (Door)"}
												</label>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
