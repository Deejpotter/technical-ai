/**
 * Tests for StepsPerMmSection Component
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import StepsPerMmSection from "./StepsPerMmSection";

describe("StepsPerMmSection", () => {
	it("renders the component with default values", () => {
		render(<StepsPerMmSection />);

		// Check that component title is rendered
		expect(screen.getByText("Steps per millimeter")).toBeInTheDocument();

		// Check that the description is rendered
		expect(
			screen.getByText(
				/The steps per millimeter \(steps\/mm\) calculation is used to calibrate/
			)
		).toBeInTheDocument();

		// Check that input fields are rendered with correct default values
		expect(screen.getByLabelText("Current Steps/mm")).toHaveValue("");
		expect(screen.getByLabelText("Target Value")).toHaveValue("100");
		expect(screen.getByLabelText("Measured Value")).toHaveValue("");

		// Check that the result shows placeholder value when no calculation is performed
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("calculates new steps/mm value correctly when all inputs are provided", async () => {
		render(<StepsPerMmSection />);

		// Get input fields
		const currentStepsInput = screen.getByLabelText("Current Steps/mm");
		const measuredValueInput = screen.getByLabelText("Measured Value");

		// Enter values
		fireEvent.change(currentStepsInput, { target: { value: "80" } });
		fireEvent.change(measuredValueInput, { target: { value: "95" } });

		// Wait for the calculation effect to run
		await waitFor(() => {
			// Expected calculation: (80 * 100) / 95 = 84.21
			expect(screen.getByText("84.21")).toBeInTheDocument();
		});

		// Check that the instructions are displayed with the calculated value
		expect(
			screen.getByText(/Enter this value, up to 2 decimal places, into Marlin/)
		).toBeInTheDocument();
		expect(screen.getByText(/M92 X84.21/)).toBeInTheDocument();
	});

	it("updates the calculation when input values change", async () => {
		render(<StepsPerMmSection />);

		// Get input fields
		const currentStepsInput = screen.getByLabelText("Current Steps/mm");
		const targetValueInput = screen.getByLabelText("Target Value");
		const measuredValueInput = screen.getByLabelText("Measured Value");

		// Enter initial values
		fireEvent.change(currentStepsInput, { target: { value: "80" } });
		fireEvent.change(measuredValueInput, { target: { value: "95" } });

		// Wait for the calculation effect to run
		await waitFor(() => {
			expect(screen.getByText("84.21")).toBeInTheDocument();
		});

		// Change input values
		fireEvent.change(targetValueInput, { target: { value: "50" } });

		// Wait for the recalculation
		await waitFor(() => {
			// Expected calculation: (80 * 50) / 95 = 42.11
			expect(screen.getByText("42.11")).toBeInTheDocument();
		});
	});

	it("does not display a result when inputs are invalid", async () => {
		render(<StepsPerMmSection />);

		// Get input fields
		const currentStepsInput = screen.getByLabelText("Current Steps/mm");
		const measuredValueInput = screen.getByLabelText("Measured Value");

		// Enter invalid values
		fireEvent.change(currentStepsInput, { target: { value: "invalid" } });
		fireEvent.change(measuredValueInput, { target: { value: "95" } });

		// Check that the result is not displayed
		expect(screen.getByText("—")).toBeInTheDocument();

		// Test with zero in the denominator (measured value)
		fireEvent.change(currentStepsInput, { target: { value: "80" } });
		fireEvent.change(measuredValueInput, { target: { value: "0" } });

		// Check that the result is not displayed
		expect(screen.getByText("—")).toBeInTheDocument();
	});
});
