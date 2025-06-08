"use client";
import React, { useState, useEffect } from "react";

/**
 * Component for calculating and displaying CNC calibration data.
 */
const StartupGcodeGeneratorSection = () => {
	const [bedSizeX, setBedSizeX] = useState("300");
	const [bedSizeY, setBedSizeY] = useState("300");
	const [isZAutoAlign, setIsZAutoAlign] = useState(false);
	const [isHomeBeforePrinting, setIsHomeBeforePrinting] = useState(true);
	const [isBedLeveling, setIsBedLeveling] = useState(false);
	const [isKissPurge, setIsKissPurge] = useState(false);
	const [isAudioFeedback, setIsAudioFeedback] = useState(false);
	const [startupGCode, setStartupGCode] = useState("");

	// Strip state
	const [stripX, setStripX] = useState("200");
	const [stripY, setStripY] = useState("0");
	const [stripRetraction, setStripRetraction] = useState("0.7");
	const [stripDistance, setStripDistance] = useState("0.1");

	// Helper functions and script templates
	const chirp = `; sound chirp (Optional)\nM300 P75 S1750\nM300 P250 S0\nM300 P75 S1750\nM300 P75 S0\n; End Sound chirp\n`;
	const g34 = `G34 ; Align Z Steppers\n`;
	const abl = `G29 A1 ; Activate UBL\nG29 L0 ; Load the mesh stored in slot 0 (from G29 S0)\nG29 J ; No size specified on the J option tells G29 to probe the specified 3 points and tilt the mesh according to what it finds. level plane.\n`;
	const footer = `; Footer - Reset extruder and go to absolute extrusion mode\nG92 E0 ; Reset Extruder\nG90 ; Reset Absolute Positioning\nG0 Z4 F400 ; Move down just a bit\n`;
	const homeTemplate = `G90 ; Set absolute positioning mode\nG28 ; Home the printer\n`;

	const header = () => {
		const timestamp = new Date().toDateString();
		return `; Startup GCode Generator\n; Generated at ${timestamp} by https://www.makerstore.com.au\n`;
	};

	// Conditional rendering of KISS Purge options
	const kissPurgeOptions = isKissPurge ? (
		<div>
			{/* Strip X Position */}
			<div className="row align-items-center py-2">
				<div className="col-lg-5 col-md-3 col-6 font-weight-bold text-sm-right">
					<label className="align-text-middle mb-0" htmlFor="sgg_strip_x">
						Strip X Position
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="text"
						className="form-control"
						id="sgg_strip_x"
						value={stripX}
						onChange={(e) => setStripX(e.target.value)}
					/>
				</div>
				<div className="col-lg-5 col-md-7 col-12 my-1">
					The X position for the landing strip.
				</div>
			</div>

			{/* Strip Y Position */}
			<div className="row align-items-center py-2">
				<div className="col-lg-5 col-md-3 col-6 font-weight-bold text-sm-right">
					<label className="align-text-middle mb-0" htmlFor="sgg_strip_y">
						Strip Y Position
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="text"
						className="form-control"
						id="sgg_strip_y"
						value={stripY}
						onChange={(e) => setStripY(e.target.value)}
					/>
				</div>
				<div className="col-lg-5 col-md-7 col-12 my-1">
					The Y position for the landing strip.
				</div>
			</div>

			{/* Retraction After Purge */}
			<div className="row align-items-center py-2">
				<div className="col-lg-5 col-md-3 col-6 font-weight-bold text-sm-right">
					<label
						className="align-text-middle mb-0"
						htmlFor="sgg_strip_retraction"
					>
						Retraction After Purge
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="text"
						className="form-control"
						id="sgg_strip_retraction"
						value={stripRetraction}
						onChange={(e) => setStripRetraction(e.target.value)}
					/>
				</div>
				<div className="col-lg-5 col-md-7 col-12 my-1">
					The amount of retraction after the KISS purge.
				</div>
			</div>

			{/* Distance From Bed */}
			<div className="row align-items-center py-2">
				<div className="col-lg-5 col-md-3 col-6 font-weight-bold text-sm-right">
					<label
						className="align-text-middle mb-0"
						htmlFor="sgg_strip_distance"
					>
						Distance From Bed
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="text"
						className="form-control"
						id="sgg_strip_distance"
						value={stripDistance}
						onChange={(e) => setStripDistance(e.target.value)}
					/>
				</div>
				<div className="col-lg-5 col-md-7 col-12 my-1">
					The distance from the nozzle to the bed at Z=0.
				</div>
			</div>
		</div>
	) : null;

	useEffect(() => {
		// Generate the startup GCode based on the current state
		let gCode = `; Startup GCode Generated\n`;

		if (isHomeBeforePrinting) {
			gCode += `G28 ; Home the printer\n`;
		}
		if (isZAutoAlign) {
			gCode += `G34 ; Align Z Steppers\n`;
		}
		if (isBedLeveling) {
			gCode += `G29 ; Bed Leveling\n`;
		}
		if (isKissPurge) {
			gCode += `; KISS Purge Logic Here\n`;
		}
		if (isAudioFeedback) {
			gCode += `; Audio Feedback Logic Here\n`;
		}

		gCode += `; Custom startup commands here\n`;
		setStartupGCode(gCode);
	}, [
		isZAutoAlign,
		isHomeBeforePrinting,
		isBedLeveling,
		isKissPurge,
		isAudioFeedback,
	]);

	// Handlers for input changes
	const handleBedSizeXChange = (event) => {
		setBedSizeX(event.target.value);
	};

	const handleBedSizeYChange = (event) => {
		setBedSizeY(event.target.value);
	};

	return (
		<>
			<div className="row my-3 mt-5">
				<div className="col-sm-12">
					<h2>
						<i className="fa fa-align-left" aria-hidden="true"></i> Startup
						GCode Generator
					</h2>
					<p>
						The startup code generator creates startup GCode for your 3D
						Printer. Simply copy and paste the output into your slicers startup
						gcode settings and you&apos;re done.
						<br />
						You can enable a number of features including Bed Leveling, Nozzle
						Purge and Wipe, Sound Alerts and more.
					</p>
				</div>
			</div>

			<h5>Printer</h5>
			<div className="row align-items-center py-2 border border-primary rounded">
				{/* Bed Size X */}
				<div className="col-lg-3 col-md-3 col-6 font-weight-bold text-sm-right">
					<label htmlFor="sgg_x_size">Bed Size X</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="text"
						className="form-control"
						id="sgg_x_size"
						value={bedSizeX}
						onChange={handleBedSizeXChange}
					/>
				</div>
				<div className="col-lg-8 col-md-7 col-12 my-1">
					The X size of your 3D Printer Bed in mm
				</div>

				{/* Bed Size Y */}
				<div className="col-lg-3 col-md-3 col-6 font-weight-bold text-sm-right">
					<label htmlFor="sgg_y_size">Bed Size Y</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="text"
						className="form-control"
						id="sgg_y_size"
						value={bedSizeY}
						onChange={handleBedSizeYChange}
					/>
				</div>
				<div className="col-lg-8 col-md-7 col-12 my-1">
					The Y size of your 3D Printer Bed in mm
				</div>
			</div>
			<br />

			<h5>Options</h5>
			<div className="row align-items-center py-2 border border-primary rounded">
				<div className="col-lg-3 col-md-3 col-6 font-weight-bold   text-sm-right">
					<label className="align-text-middle mb-0" htmlFor="sgg_opt_g34">
						Add Z Auto-Align
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="Checkbox"
						className="form-control"
						id="sgg_opt_g34"
						checked={isZAutoAlign}
						onChange={() => setIsZAutoAlign(!isZAutoAlign)}
					/>
				</div>
				<div className="col-lg-8 col-md-7 col-12 my-1">
					Execute a G34 and align the Z axis before homing the printer.
				</div>

				<div className="col-lg-3 col-md-3 col-6 font-weight-bold   text-sm-right">
					<label className="align-text-middle mb-0" htmlFor="sgg_opt_home">
						Home Before Printing
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="Checkbox"
						className="form-control"
						id="sgg_opt_home"
						checked={isHomeBeforePrinting}
						onChange={() => setIsHomeBeforePrinting(!isHomeBeforePrinting)}
					/>
				</div>
				<div className="col-lg-8 col-md-7 col-12 my-1">
					Execute a G28 and home the printer before printing. (required for most
					printers)
				</div>

				<div className="col-lg-3 col-md-3 col-6 font-weight-bold   text-sm-right">
					<label
						className="align-text-middle mb-0"
						htmlFor="sgg_opt_bedleveling"
					>
						Enable Bed Levling
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="Checkbox"
						className="form-control"
						id="sgg_opt_bedleveling"
						checked={isBedLeveling}
						onChange={() => setIsBedLeveling(!isBedLeveling)}
					/>
				</div>
				<div className="col-lg-8 col-md-7 col-12 my-1">
					G29 - Adds bed levling, Loads from Mesh 0, Performs mesh tilt before
					printing to level plane.
				</div>

				<div className="col-lg-3 col-md-3 col-6 font-weight-bold   text-sm-right">
					<label className="align-text-middle mb-0" htmlFor="sgg_opt_kiss">
						Enable KISS Purge
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="Checkbox"
						className="form-control"
						id="sgg_opt_kiss"
						checked={isKissPurge}
						onChange={() => setIsKissPurge(!isKissPurge)}
					/>
				</div>
				<div className="col-lg-8 col-md-7 col-12 my-1">
					Uses landing strip on your print bed to purge and prime nozzle, wipe
					tip right before printing. This feature requires a small space on your
					print bed to have a piece of painters tape on the front of your bed,
					called a landing strip, for the purge and wipe.
					<br />
					This feature allows you to turn off things like a &quot;Skirt&quot; or
					purge line that takes up more space on your bed. <br />
					<br />
					Landing Strip Size 15mm X 40mm. <br />
					<span className="font-weight-bold">
						This feature only works on a rectangular print bed.{" "}
					</span>
					<br /> [See this in action]
				</div>

				{/* Conditionally render the KISS Purge Options */}
				{kissPurgeOptions}

				<div className="col-lg-3 col-md-3 col-6 font-weight-bold   text-sm-right">
					<label
						className="align-text-middle mb-0"
						htmlFor="sgg_opt_audio_feedback"
					>
						Enable Audio Feedback
					</label>
				</div>
				<div className="col-lg-1 col-md-2 col-6 my-1">
					<input
						type="Checkbox"
						className="form-control"
						id="sgg_opt_audio_feedback"
						checked={isAudioFeedback}
						onChange={() => setIsAudioFeedback(!isAudioFeedback)}
					/>
				</div>
				<div className="col-lg-8 col-md-7 col-12 my-1">
					Adds M300 Audio feedback and a CHARGE! Fanfare when printing begins.
				</div>
			</div>
			<br />

			<h5>Output</h5>
			<div className="row align-items-center py-2 border border-primary rounded">
				<div className="col-lg-3 col-md-3 col-6 font-weight-bold text-sm-right">
					<label htmlFor="sgg_code">Startup Code</label>
				</div>
				<div className="col-lg-8 col-md-2 col-6 my-1">
					<textarea className="form-control" id="sgg_code" rows={5} readOnly />
				</div>
			</div>

			{/* Modal */}
			<div
				className="modal fade"
				id="errorModal"
				tabIndex={-1}
				role="dialog"
				aria-labelledby="errorModalLabel"
				aria-hidden="true"
			>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="errorModalLabel">
								Error Generating GCode
							</h5>
							<button
								type="button"
								className="close"
								data-dismiss="modal"
								aria-label="Close"
							>
								<span aria-hidden="true">×</span>
							</button>
						</div>
						<div className="modal-body" id="errorMessage"></div>
						<div className="modal-footer">
							<button
								type="button"
								className="btn btn-secondary"
								data-dismiss="modal"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default StartupGcodeGeneratorSection;
