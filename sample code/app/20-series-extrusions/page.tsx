"use client";
import React, { useState } from "react";

const CuttingCalculator = () => {
	const [parts, setParts] = useState([]);
	const [cutList, setCutList] = useState([]);
	const [color, setColor] = useState("S"); // Default color silver
	const [profile, setProfile] = useState("20x20"); // Default profile

	// Standard stock lengths for 20 Series Extrusions
	const standardStockLengths = [500, 1000, 1500, 3000];

	// Adds a new part requirement
	const addPart = () => {
		setParts([...parts, { length: 0, quantity: 1 }]);
	};

	// Updates part requirement details
	const updatePart = (index, field, value) => {
		const updatedParts = parts.map((part, i) =>
			i === index ? { ...part, [field]: parseInt(value, 10) } : part
		);
		setParts(updatedParts);
	};

	/**
	 * Optimizes and calculates the cut list
	 */
	const calculateCutList = () => {
		// Sort parts in decreasing order of length.
		// This approach helps in fitting longer parts first, potentially reducing waste.
		const sortedParts = [...parts].sort((a, b) => b.length - a.length);

		let newCutList = [];

		// Iterate over each part in the sorted list
		for (let part of sortedParts) {
			// For each part, account for its quantity
			for (let i = 0; i < part.quantity; i++) {
				let fitted = false;

				// Find the shortest stock length that can accommodate the part.
				// We use Array.find to iterate over the standardStockLengths array and return
				// the first length that is greater than or equal to the part's length.
				const suitableStockLength = standardStockLengths.find(
					(length) => length >= part.length
				);

				// Attempt to fit the part in an existing stock length in the newCutList.
				for (let cut of newCutList) {
					// Check if the current cut's stock length matches the suitable stock length
					// and it has enough unused length to accommodate the part.
					if (
						cut.stockLength === suitableStockLength &&
						cut.stockLength - cut.usedLength >= part.length
					) {
						// If it fits, increase the used length of the stock
						cut.usedLength += part.length;
						// Add the part to the cuts array of this stock length
						cut.cuts.push({ length: part.length, quantity: 1 });
						fitted = true;
						break;
					}
				}

				// If the part did not fit in any existing cuts, create a new cut.
				if (!fitted) {
					let newCut = {
						// Use the suitable stock length for this new cut.
						stockLength: suitableStockLength,
						// The used length is initially the length of the part.
						usedLength: part.length,
						// Initialize cuts with this part.
						cuts: [{ length: part.length, quantity: 1 }],
					};
					// Add this new cut to the newCutList.
					newCutList.push(newCut);
				}
			}
		}

		// Update the state with the new calculated cut list.
		setCutList(newCutList);
	};

	// Renders the component UI
	return (
		<div>
			<h2>20 Series Extrusion Cutting Calculator</h2>

			{/* Profile and Color selection */}
			<div>
				<label>Profile: </label>
				<select value={profile} onChange={(e) => setProfile(e.target.value)}>
					<option value="20x20">20x20</option>
					<option value="20x40">20x40</option>
					<option value="20x60">20x60</option>
					<option value="20x80">20x80</option>
					<option value="C-beam">C-beam</option>
				</select>
			</div>
			<div>
				<label>Color: </label>
				<select value={color} onChange={(e) => setColor(e.target.value)}>
					<option value="S">Silver</option>
					<option value="B">Black</option>
				</select>
			</div>

			{/* Parts input form */}
			{parts.map((part, index) => (
				<div key={index}>
					<input
						type="number"
						value={part.length}
						onChange={(e) => updatePart(index, "length", e.target.value)}
						placeholder="Length (mm)"
					/>
					<input
						type="number"
						value={part.quantity}
						onChange={(e) => updatePart(index, "quantity", e.target.value)}
						placeholder="Quantity"
					/>
				</div>
			))}
			<button onClick={addPart}>Add Part</button>
			<button onClick={calculateCutList}>Calculate Cut List</button>

			{/* Displaying the optimized cut list */}
			<h2>Cut List and Stock Extrusions</h2>
			{cutList.map((cutItem, index) => (
				<div key={index}>
					<p>
						Extrusion added to invoice: LR-{profile}-{color}-
						{cutItem.stockLength}
					</p>
					{cutItem.cuts.map((cut, cutIndex) => (
						<p key={cutIndex}>
							Cutting fee: {cut.quantity} x LR-{profile}-{color}-
							{cutItem.stockLength} cut to {cut.quantity} x LR-{profile}-{color}
							-{cut.length}
						</p>
					))}
				</div>
			))}
		</div>
	);
};

export default CuttingCalculator;
