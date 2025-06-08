/**
 * Results panel component
 * Updated: 17/05/2025
 * Author: Daniel Potter
 * Description: This component displays the results of the table and enclosure calculator.
 * It should take the results and configuration as props and render them in a user-friendly format.
 */

"use client";
import React, { useRef } from "react";
import {
	Results,
	TableConfig,
	MaterialConfig,
	DoorType,
	DoorTypeDisplayNames,
} from "@/types/box-shipping-calculator/box-shipping-types";

interface ResultsPanelProps {
	results: Results;
	config: TableConfig;
	materialConfig: MaterialConfig;
	tableDimensions: any;
	enclosureDimensions: any;
	materialTypesMap: Record<string, any>;
	isCalculating?: boolean;
}

/**
 * NOTE: The BOM and results are only displayed if the calculation results are present.
 * If no results are available (e.g., user has not enabled Table or Enclosure, or inputs are invalid),
 * an info alert is shown instead. This helps guide the user to configure the calculator correctly.
 */

/**
 * Client component for displaying results
 */
export function ResultsPanel({
	results,
	config,
	materialConfig,
	tableDimensions,
	enclosureDimensions,
	materialTypesMap,
	isCalculating,
}: ResultsPanelProps) {
	const printRef = useRef<HTMLDivElement>(null);

	/**
	 * Export BOM to CSV format (WooCommerce-ready)
	 * Only includes: Item, SKU, QTY, Description/Length
	 */
	const exportToCSV = () => {
		const bomData = generateBOMData();
		const csvContent = convertToCSV(bomData);
		downloadFile(csvContent, `BOM_${generateFilename()}.csv`, "text/csv");
	};

	/**
	 * Print BOM functionality (for physical records or manual entry)
	 */
	const printBOM = () => {
		const printWindow = window.open("", "_blank");
		if (printWindow && printRef.current) {
			printWindow.document.write(`
				<html>
					<head>
						<title>Bill of Materials</title>
						<style>
							body { font-family: Arial, sans-serif; margin: 20px; }
							table { border-collapse: collapse; width: 100%; margin: 10px 0; }
							th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
							th { background-color: #f5f5f5; }
							.alert { padding: 15px; margin: 10px 0; border-radius: 4px; background-color: #d1ecf1; }
							@media print { button { display: none; } }
						</style>
					</head>
					<body>
						${printRef.current.innerHTML}
					</body>
				</html>
			`);
			printWindow.document.close();
			printWindow.print();
		}
	};

	/**
	 * Generate BOM data for export and display (WooCommerce-ready)
	 * Only includes: Item, SKU, QTY, Description/Length
	 */
	const generateBOMData = () => {
		const bomItems: any[] = [];

		// Table frame extrusions
		if (results.table) {
			bomItems.push({
				item: "2060 Linear Rail (Length)",
				description: `${results.table.extrusions.rail2060Length}mm (Length)`,
				sku: `LR-2060-${results.table.extrusions.rail2060Length}`,
				qty: results.table.extrusions.qtyRail2060Length,
			});
			bomItems.push({
				item: "2060 Linear Rail (Width)",
				description: `${results.table.extrusions.rail2060Width}mm (Width)`,
				sku: `LR-2060-${results.table.extrusions.rail2060Width}`,
				qty: results.table.extrusions.qtyRail2060Width,
			});
			bomItems.push({
				item: "4040 Linear Rail (Legs)",
				description: `${results.table.extrusions.rail4040Legs}mm (Legs)`,
				sku: `LR-4040-${results.table.extrusions.rail4040Legs}`,
				qty: results.table.extrusions.qtyRail4040Legs,
			});
			// Table hardware (expand as needed)
			bomItems.push({
				item: "In-Out Corner Bracket – 60mm",
				description: "Table corners",
				sku: "BRAC-IOCNR-60",
				qty: results.table.hardware.IOCNR_60,
			});
			// ...add other hardware as needed...
		}

		// Enclosure frame extrusions
		if (results.enclosure) {
			// Example: add enclosure extrusions and hardware
			// ...add enclosure BOM items here...
		}

		// Panels
		if (results.panels && materialConfig.includePanels) {
			results.panels.panels.forEach((panel: any) => {
				bomItems.push({
					item: `Panel (${panel.position})`,
					description: `${panel.length}mm x ${panel.width}mm x ${panel.thickness}mm`,
					sku: `PANEL-${panel.position.toUpperCase()}`,
					qty: 1,
				});
			});
		}

		// Doors
		if (results.doors && config.includeDoors) {
			results.doors.panels?.forEach((door: any) => {
				bomItems.push({
					item: `Door Panel (${door.position})`,
					description: `${door.length}mm x ${door.width}mm x ${door.thickness}mm`,
					sku: `DOOR-${door.position.toUpperCase()}`,
					qty: 1,
				});
			});
		}

		// Mounting hardware
		if (results.mounting) {
			// ...add mounting hardware as needed...
		}

		return bomItems;
	};

	/**
	 * Convert BOM data to CSV (WooCommerce-friendly)
	 */
	const convertToCSV = (bomData: any[]) => {
		const header = ["Item", "SKU", "QTY", "Description/Length"];
		const rows = bomData.map((row) => [
			row.item || "",
			row.sku || "",
			row.qty || "",
			row.description || "",
		]);
		return [header, ...rows].map((r) => r.join(",")).join("\n");
	};

	/**
	 * Generate filename with timestamp
	 */
	const generateFilename = (): string => {
		const now = new Date();
		const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, "");
		const components = [];
		if (config.includeTable) components.push("Table");
		if (config.includeEnclosure) components.push("Enclosure");
		return `${components.join("_")}_${timestamp}`;
	};

	/**
	 * Download file helper
	 */
	const downloadFile = (
		content: string,
		filename: string,
		mimeType: string
	) => {
		const blob = new Blob([content], { type: mimeType });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="card mb-4">
			<div className="card-header d-flex justify-content-between align-items-center">
				<div>
					<h2 className="h5 mb-0">Bill of Materials</h2>
				</div>
				<div className="btn-group">
					<button
						className="btn btn-sm btn-outline-success"
						onClick={exportToCSV}
						disabled={
							isCalculating ||
							(!config.includeTable && !config.includeEnclosure)
						}
						title="Export to CSV"
					>
						<i className="bi bi-filetype-csv me-1"></i> CSV
					</button>
					<button
						className="btn btn-sm btn-outline-secondary"
						onClick={printBOM}
						disabled={
							isCalculating ||
							(!config.includeTable && !config.includeEnclosure)
						}
						title="Print bill of materials"
					>
						<i className="bi bi-printer me-1"></i> Print
					</button>
				</div>
			</div>
			<div className="card-body" ref={printRef}>
				{/* Project Summary */}
				<div className="alert alert-primary mb-4">
					<h3 className="h6">Project Summary</h3>
					<div className="row">
						{config.includeTable && (
							<div className="col-md-4 mb-2">
								<strong>Table:</strong> {tableDimensions.length}mm x{" "}
								{tableDimensions.width}mm x {tableDimensions.height}mm
								{config.isOutsideDimension ? " (OD)" : " (ID)"}
							</div>
						)}
						{config.includeEnclosure && (
							<div className="col-md-4 mb-2">
								<strong>Enclosure:</strong> {enclosureDimensions.length}mm x{" "}
								{enclosureDimensions.width}mm x {enclosureDimensions.height}
								mm
								{config.isOutsideDimension ? " (OD)" : " (ID)"}
							</div>
						)}
						{config.includeDoors && (
							<div className="col-md-4 mb-2">
								<strong>Doors:</strong>{" "}
								{Object.values(config.doorConfig).filter(Boolean).length}
								{Object.entries(config.doorConfig)
									.filter(([_, enabled]) => enabled)
									.map(([pos]) => " " + pos.replace("Door", ""))
									.join(", ")}
							</div>
						)}
						{materialConfig.includePanels && (
							<div className="col-md-4 mb-2">
								<strong>Panels:</strong>{" "}
								{
									Object.values(materialConfig.panelConfig).filter(Boolean)
										.length
								}{" "}
								({materialTypesMap[materialConfig.type]?.name},{" "}
								{materialConfig.thickness}mm)
							</div>
						)}
					</div>
				</div>
				{/* Single BOM Table (WooCommerce-ready, no cost columns) */}
				{results.table || results.enclosure ? (
					<div className="mb-4">
						<h3 className="h6 mb-3">Bill of Materials (BOM)</h3>
						<div className="table-responsive">
							<table className="table table-striped table-bordered">
								<thead>
									<tr>
										<th>Item</th>
										<th>SKU</th>
										<th>QTY</th>
										<th>Description/Length</th>
									</tr>
								</thead>
								<tbody>
									{generateBOMData().map((row, idx) => (
										<tr key={idx}>
											<td>{row.item}</td>
											<td>{row.sku}</td>
											<td>{row.qty}</td>
											<td>{row.description}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				) : (
					<div className="alert alert-info">
						No calculation performed. Please configure the calculator and run a
						calculation to see the Bill of Materials.
					</div>
				)}
			</div>
		</div>
	);
}
