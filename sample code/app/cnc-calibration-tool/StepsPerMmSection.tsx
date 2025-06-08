"use client";
import React, { useState, useEffect } from "react";

/**
 * Component for calculating and displaying CNC calibration data.
 * Allows users to input current steps/mm, target movement, and measured movement
 * to calculate the correct steps/mm value for accurate axis calibration.
 */
const StepsPerMmSection = () => {
	// State for holding form input values as strings
	const [currentSteps, setCurrentSteps] = useState("");
	const [expectedMovement, setExpectedMovement] = useState("100");
	const [actualMovement, setActualMovement] = useState("");
	const [newSteps, setNewSteps] = useState("");

	// Effect hook for calculating new steps per millimeter
	useEffect(() => {
		const calculateNewSteps = () => {
			// Convert string values to numbers for calculation
			const currentStepsNum = Number(currentSteps);
			const expectedMovementNum = Number(expectedMovement);
			const actualMovementNum = Number(actualMovement);

			// Prevent division by zero and invalid inputs
			if (
				actualMovementNum === 0 ||
				isNaN(currentStepsNum) ||
				isNaN(expectedMovementNum) ||
				isNaN(actualMovementNum)
			) {
				return "";
			}
			const calculatedSteps =
				(currentStepsNum * expectedMovementNum) / actualMovementNum;
			return calculatedSteps.toFixed(2); // Set new steps with two decimal places
		};
		setNewSteps(calculateNewSteps());
	}, [currentSteps, expectedMovement, actualMovement]);

	// Handler for changing input values
	const handleChange = (setter) => (e) => setter(e.target.value);

	return (
		<div className="card border-primary">
			<div className="card-header bg-primary text-white">
				<h2 className="h4 mb-0">
					<i className="fa fa-cog me-2" aria-hidden="true"></i> Steps per
					millimeter
				</h2>
			</div>
			<div className="card-body">
				{/* Description of the steps/mm calculation */}
				<p className="card-text mb-4">
					The steps per millimeter (steps/mm) calculation is used to calibrate
					the X, Y, Z, and E axes of your CNC machine. This calculation is used
					regardless of the axis. The process is to have a known target you are
					trying to reach and then measure the actual value. The calculator will
					then adjust your steps/mm based on the measured value to provide a new
					value which will match the target value.
				</p>

				{/* Current Steps/mm input row */}
				<div className="row align-items-center py-2 mb-2">
					<div className="col-lg-3 col-md-3 col-sm-12 mb-2 mb-sm-0">
						<label className="form-label fw-bold" htmlFor="spm_old">
							Current Steps/mm
						</label>
					</div>
					<div className="col-lg-2 col-md-3 col-sm-4 mb-2 mb-sm-0">
						<div className="input-group">
							<input
								type="text"
								className="form-control"
								id="spm_old"
								value={currentSteps}
								onChange={handleChange(setCurrentSteps)}
								placeholder="Enter value"
							/>
							<span className="input-group-text">steps/mm</span>
						</div>
					</div>
					<div className="col-lg-7 col-md-6 col-sm-8">
						<small className="text-muted">
							<code>M503</code> G-Code will reveal the <code>M92</code> values.
							Use your existing X/Y/Z/E value for this field.
						</small>
					</div>
				</div>

				{/* Target Value input row */}
				<div className="row align-items-center py-2 mb-2">
					<div className="col-lg-3 col-md-3 col-sm-12 mb-2 mb-sm-0">
						<label className="form-label fw-bold" htmlFor="spm_target">
							Target Value
						</label>
					</div>
					<div className="col-lg-2 col-md-3 col-sm-4 mb-2 mb-sm-0">
						<div className="input-group">
							<input
								type="text"
								className="form-control"
								id="spm_target"
								value={expectedMovement}
								onChange={handleChange(setExpectedMovement)}
							/>
							<span className="input-group-text">mm</span>
						</div>
					</div>
					<div className="col-lg-7 col-md-6 col-sm-8">
						<small className="text-muted">
							The expected amount of axis movement. For example, enter 100 if
							you move the axis 100mm.
						</small>
					</div>
				</div>

				{/* Measured Value input row */}
				<div className="row align-items-center py-2 mb-2">
					<div className="col-lg-3 col-md-3 col-sm-12 mb-2 mb-sm-0">
						<label className="form-label fw-bold" htmlFor="spm_measured">
							Measured Value
						</label>
					</div>
					<div className="col-lg-2 col-md-3 col-sm-4 mb-2 mb-sm-0">
						<div className="input-group">
							<input
								type="text"
								className="form-control"
								id="spm_measured"
								value={actualMovement}
								onChange={handleChange(setActualMovement)}
								placeholder="Enter value"
							/>
							<span className="input-group-text">mm</span>
						</div>
					</div>
					<div className="col-lg-7 col-md-6 col-sm-8">
						<small className="text-muted">
							The actual amount of axis movement. Use of calipers is
							recommended, but a metric ruler can be used.
						</small>
					</div>
				</div>

				{/* Result row with calculated new steps/mm value */}
				<div className="row mt-4">
					<div className="col-md-8 offset-md-2">
						<div className="card bg-light">
							<div className="card-body text-center">
								<h3 className="h5 card-title">New Steps/mm Value</h3>
								<p className="display-6 text-primary mb-3">{newSteps || "—"}</p>
								{newSteps && (
									<small className="text-muted">
										Enter this value, up to 2 decimal places, into Marlin for
										the axis you are calibrating. For example{" "}
										<code>M92 X{newSteps}</code> for the X axis. Be sure to then
										save your configuration in Marlin with <code>M500</code>.
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

export default StepsPerMmSection;
