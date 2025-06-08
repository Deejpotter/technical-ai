"use client";
import React, { useState, useEffect } from "react";

/**
 * Component for calculating flow compensation for 3D printers.
 * Helps users adjust flow rate to compensate for filament expansion
 * by measuring wall thickness and calculating the optimal flow percentage.
 */
const FlowCompensationSection = () => {
	// State for form values
	const [currentFlow, setCurrentFlow] = useState("100");
	const [nozzleWidth, setNozzleWidth] = useState("0.4");
	const [wallMeasurements, setWallMeasurements] = useState({
		c1: "",
		c2: "",
		c3: "",
		c4: "",
	});
	const [newFlow, setNewFlow] = useState("");

	// Calculate new flow percentage when inputs change
	useEffect(() => {
		const calculateFlow = () => {
			// Convert all measurements to numbers and check for valid inputs
			const measurements = Object.values(wallMeasurements).map(Number);
			if (measurements.some(isNaN)) return "";

			// Calculate average wall thickness from all measurements
			const avgThickness =
				measurements.reduce((a, b) => a + b, 0) / measurements.length;
			if (avgThickness === 0) return "";

			// Convert other inputs to numbers
			const currentFlowNum = Number(currentFlow);
			const nozzleWidthNum = Number(nozzleWidth);
			if (isNaN(currentFlowNum) || isNaN(nozzleWidthNum)) return "";

			// Calculate new flow percentage based on measured vs expected thickness
			return ((currentFlowNum * nozzleWidthNum) / avgThickness).toFixed(2);
		};
		setNewFlow(calculateFlow());
	}, [currentFlow, nozzleWidth, wallMeasurements]);

	// Event handlers for form inputs
	const handleCurrentFlowChange = (e) => {
		setCurrentFlow(e.target.value);
	};

	const handleNozzleWidthChange = (e) => {
		setNozzleWidth(e.target.value);
	};

	const handleWallChange = (wall) => (e) => {
		setWallMeasurements({ ...wallMeasurements, [wall]: e.target.value });
	};

	return (
		<div className="card border-success">
			<div className="card-header bg-success text-white">
				<h2 className="h4 mb-0">
					<i className="fa fa-tint me-2" aria-hidden="true"></i> Flow
					Compensation
				</h2>
			</div>
			<div className="card-body">
				{/* Description of flow compensation */}
				<p className="card-text mb-4">
					Flow compensation is used to compensate for the expansion of the
					filament being pressed against the layer underneath. Use this
					calculator to correct for the expansion of the filament by adjusting
					the flow rate. To use this calculator, print a 20mm x 20mm x 20mm cube
					in vase mode and then measure the top 5 layers with your caliper.
					Measure near the center of the cube, not near the edges. Enter the
					values below to see how you can adjust your flow compensation to
					produce the properly sized line width of extruded material.
					<br />
					<span className="fw-bold mt-2 d-inline-block">
						Note that flow compensation can differ based on material.
					</span>
				</p>

				{/* Current Flow % input row */}
				<div className="row align-items-center py-2 mb-2">
					<div className="col-lg-3 col-md-3 col-sm-12 mb-2 mb-sm-0">
						<label className="form-label fw-bold" htmlFor="flow_old">
							Current Flow %
						</label>
					</div>
					<div className="col-lg-2 col-md-3 col-sm-4 mb-2 mb-sm-0">
						<div className="input-group">
							<input
								type="text"
								className="form-control"
								id="flow_old"
								value={currentFlow}
								onChange={handleCurrentFlowChange}
							/>
							<span className="input-group-text">%</span>
						</div>
					</div>
					<div className="col-lg-7 col-md-6 col-sm-8">
						<small className="text-muted">
							Most slicers have flow compensation set to 100% by default.
						</small>
					</div>
				</div>

				{/* Nozzle Width input row */}
				<div className="row align-items-center py-2 mb-2">
					<div className="col-lg-3 col-md-3 col-sm-12 mb-2 mb-sm-0">
						<label className="form-label fw-bold" htmlFor="flow_nozzle">
							Nozzle Width
						</label>
					</div>
					<div className="col-lg-2 col-md-3 col-sm-4 mb-2 mb-sm-0">
						<div className="input-group">
							<input
								type="text"
								className="form-control"
								id="flow_nozzle"
								value={nozzleWidth}
								onChange={handleNozzleWidthChange}
							/>
							<span className="input-group-text">mm</span>
						</div>
					</div>
					<div className="col-lg-7 col-md-6 col-sm-8">
						<small className="text-muted">
							Enter the diameter of your nozzle.
						</small>
					</div>
				</div>

				{/* Wall Measurements input row */}
				<div className="row align-items-center py-2 mb-3">
					<div className="col-lg-3 col-md-3 col-sm-12 mb-2 mb-sm-0">
						<label className="form-label fw-bold">Measured Values</label>
					</div>
					<div className="col-lg-4 col-md-5 col-sm-12">
						<div className="row g-2">
							<div className="col-3">
								<div className="input-group input-group-sm">
									<input
										type="text"
										className="form-control"
										placeholder="Side 1"
										value={wallMeasurements.c1}
										onChange={handleWallChange("c1")}
									/>
									<span className="input-group-text">mm</span>
								</div>
							</div>
							<div className="col-3">
								<div className="input-group input-group-sm">
									<input
										type="text"
										className="form-control"
										placeholder="Side 2"
										value={wallMeasurements.c2}
										onChange={handleWallChange("c2")}
									/>
									<span className="input-group-text">mm</span>
								</div>
							</div>
							<div className="col-3">
								<div className="input-group input-group-sm">
									<input
										type="text"
										className="form-control"
										placeholder="Side 3"
										value={wallMeasurements.c3}
										onChange={handleWallChange("c3")}
									/>
									<span className="input-group-text">mm</span>
								</div>
							</div>
							<div className="col-3">
								<div className="input-group input-group-sm">
									<input
										type="text"
										className="form-control"
										placeholder="Side 4"
										value={wallMeasurements.c4}
										onChange={handleWallChange("c4")}
									/>
									<span className="input-group-text">mm</span>
								</div>
							</div>
						</div>
						<small className="text-muted mt-1 d-block">
							Measure the thickness of each side of the cube wall using the top
							5 layers near the center of the wall.
						</small>
					</div>
				</div>

				{/* Result row with calculated new flow percentage */}
				<div className="row mt-4">
					<div className="col-md-8 offset-md-2">
						<div className="card bg-light">
							<div className="card-body text-center">
								<h3 className="h5 card-title">New Flow Percentage</h3>
								<p className="display-6 text-success mb-3">
									{newFlow ? `${newFlow}%` : "—"}
								</p>
								{newFlow && (
									<small className="text-muted">
										Enter this value into one or more fields of Cura&apos;s flow
										compensation fields. Shell/Skin values are most important to
										modify for accurate parts.
									</small>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FlowCompensationSection;
