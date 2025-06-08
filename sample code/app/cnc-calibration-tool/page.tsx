"use client";
import React from "react";
import LayoutContainer from "@/components/LayoutContainer";
import StepsPerMmSection from "./StepsPerMmSection";
import FlowCompensationSection from "./FlowCompensationSection";
// import StartupGcodeGeneratorSection from "./StartupGcodeGeneratorSection";

/**
 * Functional component for CNC Calibration Tool.
 * Provides calculators and resources for calibrating 3D printers and CNC machines.
 * Uses separate components for each calculator section for better code organization.
 */
const CncCalibrationTool: React.FC = () => {
	return (
		<LayoutContainer>
			<div className="py-4">
				{/* Page header with title and description */}
				<div className="row mb-4">
					<div className="col-12">
						<h1 className="display-5 fw-bold text-primary mb-3">
							CNC Calibration Tool
						</h1>
						<div className="card bg-light mb-4">
							<div className="card-body">
								<h2 className="h4 card-title">Calibration Overview</h2>
								<p className="card-text">
									Calibration is critical to 3D printer, and other CNC machine,
									accuracy. These calculators and resources will allow you to
									calibrate your printer or router for optimal results.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Steps Per MM Section - imported as separate component */}
				<div className="mb-5">
					<StepsPerMmSection />
				</div>

				{/* Flow Compensation Section - imported as separate component */}
				<div className="mb-5">
					<FlowCompensationSection />
				</div>
			</div>
		</LayoutContainer>
	);
};

export default CncCalibrationTool;
