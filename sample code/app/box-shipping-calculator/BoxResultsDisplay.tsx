/**
 * Box Results Display Component
 * Updated: 14/05/2025
 * Author: Deej Potter
 * Description: Displays detailed information about box packing results.
 * This component visualizes the packing solution with metrics like weight and volume utilization.
 */

"use client";
import React, { useMemo } from "react";
import type { MultiBoxPackingResult } from "./BoxCalculations";
import type ShippingBox from "@/types/box-shipping-calculator/ShippingBox";
import type ShippingItem from "@/types/box-shipping-calculator/ShippingItem";
import { Package2, Scale, Maximize, Ruler, AlertCircle } from "lucide-react";

interface BoxUtilizationMetrics {
	volumePercentage: number;
	weightPercentage: number;
	totalVolume: number;
	totalWeight: number;
	boxVolume: number;
}

interface BoxDimensions {
	totalLength: number;
	totalWidth: number;
	totalHeight: number;
	totalVolume: number;
}

interface BoxResultsDisplayProps {
	packingResult: MultiBoxPackingResult | null;
}

/**
 * Calculates the volume and weight utilization for a box with the given items
 *
 * @param box - The shipping box
 * @param items - Items packed in the box
 * @returns BoxUtilizationMetrics object with percentage and absolute values
 */
export function calculateBoxUtilization(
	box: ShippingBox,
	items: ShippingItem[]
): BoxUtilizationMetrics {
	const boxVolume = box.length * box.width * box.height;

	let totalItemsVolume = 0;
	let totalItemsWeight = 0;

	items.forEach((item) => {
		const quantity = item.quantity || 1;
		const itemVolume = item.length * item.width * item.height * quantity;
		totalItemsVolume += itemVolume;
		totalItemsWeight += item.weight * quantity;
	});

	const volumePercentage = (totalItemsVolume / boxVolume) * 100;
	const weightPercentage = (totalItemsWeight / box.maxWeight) * 100;

	return {
		volumePercentage,
		weightPercentage,
		totalVolume: totalItemsVolume,
		totalWeight: totalItemsWeight,
		boxVolume,
	};
}

/**
 * Calculates the total dimensions of all items in a box
 *
 * @param items - Items packed in the box
 * @returns BoxDimensions object with total length, width, height and volume
 */
export function calculateBoxDimensions(items: ShippingItem[]): BoxDimensions {
	if (items.length === 0) {
		return {
			totalLength: 0,
			totalWidth: 0,
			totalHeight: 0,
			totalVolume: 0,
		};
	}

	let totalVolume = 0;
	let maxLength = 0;
	let maxWidth = 0;
	let maxHeight = 0; // Calculate total dimensions using a simple packing strategy
	// For length and width, we take the maximum values
	// For height, we sum the heights to simulate stacking
	let totalHeight = 0;
	items.forEach((item) => {
		const quantity = item.quantity || 1;
		const itemVolume = item.length * item.width * item.height * quantity;
		totalVolume += itemVolume;

		// Update maximum dimensions
		maxLength = Math.max(maxLength, item.length);
		maxWidth = Math.max(maxWidth, item.width);
		totalHeight += item.height * quantity;
	});

	maxHeight = totalHeight; // Use the sum of heights
	return {
		totalLength: maxLength,
		totalWidth: maxWidth,
		totalHeight: maxHeight,
		totalVolume: totalVolume,
	};
}

/**
 * Displays visual box packing details including dimensions, weight, and utilization metrics
 */
export function BoxResultsDisplay({ packingResult }: BoxResultsDisplayProps) {
	if (!packingResult) {
		return null;
	}

	return (
		<div className="box-results mt-4">
			<h3 className="h4 mb-3">Box Packing Results</h3>
			{packingResult.success ? (
				<>
					{packingResult.shipments.length === 0 ? (
						<div className="alert alert-info">
							<AlertCircle size={18} className="me-2" />
							No boxes needed for the selected items.
						</div>
					) : (
						<>
							<p className="mb-2">
								Items will be packed into{" "}
								<strong>{packingResult.shipments.length}</strong> box(es).
							</p>
							<div className="row">
								{packingResult.shipments.map((shipment, index) => (
									<div key={index} className="col-md-6 col-lg-4 mb-3">
										<ShipmentCard shipment={shipment} index={index} />
									</div>
								))}
							</div>
						</>
					)}

					{packingResult.unfitItems.length > 0 && (
						<UnfitItemsCard items={packingResult.unfitItems} />
					)}
				</>
			) : (
				<div className="alert alert-warning">
					<AlertCircle size={18} className="me-2" />
					Some items could not fit in any available box.
					<UnfitItemsCard items={packingResult.unfitItems} />
				</div>
			)}
		</div>
	);
}

/**
 * Card component that displays information about a single shipment (box and its contents)
 */
function ShipmentCard({ shipment, index }: { shipment: any; index: number }) {
	const metrics = useMemo(() => {
		return calculateBoxUtilization(shipment.box, shipment.packedItems);
	}, [shipment]);

	// useMemo s
	const dimensions = useMemo(() => {
		return calculateBoxDimensions(shipment.packedItems);
	}, [shipment.packedItems]);

	const getVolumeUtilizationColorClass = (percentage: number) => {
		if (percentage < 40) return "bg-success";
		if (percentage < 80) return "bg-warning";
		return "bg-danger";
	};
	const getWeightUtilizationColorClass = (percentage: number) => {
		if (percentage < 50) return "bg-success";
		if (percentage < 85) return "bg-warning";
		return "bg-danger";
	};

	const getDimensionUtilizationClass = (percentage: number) => {
		if (percentage < 40) return "bg-success";
		if (percentage < 70) return "bg-info";
		if (percentage < 90) return "bg-warning";
		return "bg-danger";
	};

	return (
		<div className="card h-100 shadow-sm">
			<div className="card-header bg-primary text-white">
				<div className="d-flex align-items-center">
					<Package2 size={20} className="me-2" />
					<h4 className="card-title mb-0">
						Box {index + 1}: {shipment.box.name}
					</h4>
				</div>
			</div>{" "}
			<div className="card-body">
				{/* Display box dimensions and weight utilization metrics */}
				<div className="mb-3">
					{" "}
					<div className="d-flex align-items-center mb-2">
						<Ruler size={16} className="me-1" />
						<span className="fw-bold me-2">Box Dimensions:</span>
						{shipment.box.length} × {shipment.box.width} × {shipment.box.height}{" "}
						mm
					</div>
					<div className="d-flex align-items-center mb-2">
						{" "}
						<Maximize size={16} className="me-1" />
						<span className="fw-bold me-2">Items Dimensions:</span>
						{dimensions.totalLength} × {dimensions.totalWidth} ×{" "}
						{dimensions.totalHeight} mm
						{/* Calculate dimension utilization percentage for each dimension */}
						{(() => {
							const lengthPct = Math.round(
								(dimensions.totalLength / shipment.box.length) * 100
							);
							const widthPct = Math.round(
								(dimensions.totalWidth / shipment.box.width) * 100
							);
							const heightPct = Math.round(
								(dimensions.totalHeight / shipment.box.height) * 100
							);

							return (
								<span
									className={`ms-2 badge ${getDimensionUtilizationClass(
										Math.max(lengthPct, widthPct, heightPct)
									)}`}
									title="Percentage of box dimensions used by items"
								>
									({lengthPct}% × {widthPct}% × {heightPct}%)
								</span>
							);
						})()}
					</div>
					<div className="d-flex align-items-center mb-2">
						<Scale size={16} className="me-1" />
						<span className="fw-bold me-2">Total Weight:</span>
						{metrics.totalWeight}g / {shipment.box.maxWeight}g
					</div>
					<div className="mb-2">
						<div className="d-flex justify-content-between">
							<span className="fw-bold">Weight Utilization:</span>
							<span>{metrics.weightPercentage.toFixed(1)}%</span>
						</div>
						<div className="progress" style={{ height: "10px" }}>
							<div
								className={`progress-bar ${getWeightUtilizationColorClass(
									metrics.weightPercentage
								)}`}
								role="progressbar"
								style={{ width: `${Math.min(metrics.weightPercentage, 100)}%` }}
								aria-valuenow={metrics.weightPercentage}
								aria-valuemin={0}
								aria-valuemax={100}
							/>
						</div>
					</div>
					<div className="mb-3">
						<div className="d-flex justify-content-between">
							<span className="fw-bold">Volume Utilization:</span>
							<span>{metrics.volumePercentage.toFixed(1)}%</span>
						</div>
						<div className="progress" style={{ height: "10px" }}>
							<div
								className={`progress-bar ${getVolumeUtilizationColorClass(
									metrics.volumePercentage
								)}`}
								role="progressbar"
								style={{ width: `${Math.min(metrics.volumePercentage, 100)}%` }}
								aria-valuenow={metrics.volumePercentage}
								aria-valuemin={0}
								aria-valuemax={100}
							/>
						</div>
					</div>
				</div>

				<div className="mt-3">
					<h5 className="card-subtitle mb-2">Items in this box:</h5>
					<div className="table-responsive">
						<table className="table table-sm table-striped">
							<thead>
								<tr>
									<th>Item</th>
									<th>Qty</th>
									<th>Weight</th>
								</tr>
							</thead>
							<tbody>
								{shipment.packedItems.map((item: ShippingItem, idx: number) => (
									<tr key={`${String(item._id)}-${idx}`}>
										<td>
											<small>{item.name}</small>
											<div>
												<small className="text-muted">
													{item.length}×{item.width}×{item.height}mm
												</small>
											</div>
										</td>
										<td>{item.quantity || 1}</td>
										<td>{item.weight * (item.quantity || 1)}g</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Card component that displays information about items that couldn't fit in any box
 */
function UnfitItemsCard({ items }: { items: ShippingItem[] }) {
	if (items.length === 0) return null;

	return (
		<div className="card border-danger mt-3">
			<div className="card-header bg-danger text-white">
				<AlertCircle size={18} className="me-2" />
				Items That Don&apos;t Fit
			</div>
			<div className="card-body">
				<div className="table-responsive">
					<table className="table table-sm">
						<thead>
							<tr>
								<th>Item</th>
								<th>Dimensions</th>
								<th>Weight</th>
								<th>Qty</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item) => (
								<tr key={String(item._id)}>
									<td>{item.name}</td>
									<td>
										{item.length}×{item.width}×{item.height}mm
									</td>
									<td>{item.weight}g</td>
									<td>{item.quantity || 1}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p className="small text-danger mt-2 mb-0">
					These items exceed the dimensions or weight limits of all available
					boxes. Consider splitting large items or using custom shipping
					solutions.
				</p>
			</div>
		</div>
	);
}

export default BoxResultsDisplay;
