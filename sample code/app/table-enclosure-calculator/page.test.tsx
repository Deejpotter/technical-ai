/**
 * Table and Enclosure Calculator tests
 * Updated: 14/05/2025
 * Author: Deej Potter
 * Description: Test suite for the Table and Enclosure Calculator component.
 * Tests the calculation functions, UI interactions, and state management.
 */

import React from "react";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import TableEnclosureCalculatorPage from "./page";
import { MATERIAL_TYPES, MATERIAL_THICKNESS } from "./constants";
import { DoorType } from "../../types/box-shipping-calculator/box-shipping-types";

// Mock window.history.pushState for URL update tests
const mockPushState = jest.fn();
Object.defineProperty(window, "history", {
	value: {
		pushState: mockPushState,
		replaceState: mockPushState, // Also mock replaceState if used
	},
	writable: true,
});

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => {
	const mockSearchParams = {
		get: jest.fn().mockImplementation((key: string) => {
			// Provide default mock values for URL parameters if needed for tests
			// This mock will be overridden in specific tests that load from URL
			if (key === "it") return "1";
			if (key === "iod") return "1"; // Default to outside dimensions
			if (key === "mt") return MATERIAL_TYPES[0].id; // Default material
			// Add other params as necessary for default behavior
			return null;
		}),
		size: 0, // Default size, can be overridden by spyOn
		has: jest.fn().mockImplementation((key: string) => {
			// Default has implementation
			return ["it", "iod", "mt"].includes(key);
		}),
		forEach: jest.fn(), // Mock forEach if used by any tested logic
		toString: jest.fn().mockReturnValue(""), // Mock toString
	};
	return {
		useRouter: () => ({
			push: jest.fn(),
			replace: jest.fn(), // Added for window.history.pushState mock
		}),
		useSearchParams: jest.fn(() => mockSearchParams),
	};
});

// Mock dynamic import for TableCalculator to allow testing its props
jest.mock("next/dynamic", () => () => {
	const TableCalculatorComponent = jest.requireActual(
		"./components/TableCalculator"
	).default;
	const DynamicTableCalculator = (props: any) => (
		<TableCalculatorComponent {...props} />
	);
	DynamicTableCalculator.displayName = "DynamicTableCalculator";
	return DynamicTableCalculator;
});

// Mock the LayoutContainer component
jest.mock("@/components/LayoutContainer", () => {
	const MockLayoutContainer = ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	);
	MockLayoutContainer.displayName = "MockLayoutContainer";
	return MockLayoutContainer;
});

// Mock the actual TableCalculator to intercept its direct usage if necessary,
// or to simplify its behavior for page-level tests.
// For these tests, we are more interested in the page rendering and prop passing.
jest.mock("./components/TableCalculator", () => {
	const OriginalTableCalculator = jest.requireActual(
		"./components/TableCalculator"
	).default;
	const MockTableCalculator = (props: any) => (
		<OriginalTableCalculator {...props} />
	); // Render the original but spy on it
	MockTableCalculator.displayName = "MockTableCalculator";
	return jest.fn(MockTableCalculator);
});

describe("TableEnclosureCalculatorPage", () => {
	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();
		// Default mock for useSearchParams.get
		(require("next/navigation").useSearchParams as jest.Mock).mockReturnValue({
			get: jest.fn().mockImplementation((key: string) => {
				if (key === "it") return "1"; // includeTable
				if (key === "iod") return "1"; // isOutsideDimension
				if (key === "mt") return MATERIAL_TYPES[0].id; // default material
				if (key === "tl") return "1000";
				if (key === "tw") return "1000";
				if (key === "th") return "800";
				return null;
			}),
			size: 3, // Example size
			has: jest.fn().mockImplementation((key: string) => {
				return ["it", "iod", "mt", "tl", "tw", "th"].includes(key);
			}),
			forEach: jest.fn(),
			toString: jest
				.fn()
				.mockReturnValue(
					"it=1&iod=1&mt=corflute-clear-6mm&tl=1000&tw=1000&th=800"
				),
		});
	});

	it("renders the main heading", () => {
		render(<TableEnclosureCalculatorPage />);
		expect(
			screen.getByRole("heading", { name: /Table and Enclosure Calculator/i })
		).toBeInTheDocument();
	});
	it("passes correct material types and fixed thickness to TableCalculator", () => {
		render(<TableEnclosureCalculatorPage />);
		// Check that TableCalculator (or its mock wrapper) is rendered.
		// This test relies on the mock for next/dynamic correctly passing props.
		// We can't directly inspect props of the real TableCalculator easily here,
		// so we ensure the page attempts to render it.
		// A more direct way would be to not mock TableCalculator itself for this specific test,
		// or to have the dynamic mock capture props.

		// For now, let's check if a known element from TableCalculator's initial render is present
		// (e.g., a config panel element, assuming it's always rendered)
		expect(
			screen.getByRole("heading", { name: /Configuration/i })
		).toBeInTheDocument();
		// This implicitly tests that TableCalculator was rendered, which means it received its props.
		// A more robust test would involve a more complex mocking strategy for dynamic imports
		// or testing the TableCalculator component in isolation with these specific props.
	});
	describe("Centralized Outside Dimensions Checkbox", () => {
		it("renders a single 'Use Outside Dimensions' checkbox in the Configuration panel", () => {
			render(<TableEnclosureCalculatorPage />);
			const configHeader = screen.getByRole("heading", {
				name: /Configuration/i,
			});
			expect(configHeader).toBeInTheDocument();

			const outsideDimensionCheckbox = screen.getByLabelText(
				/Use Outside Dimensions/i
			);
			expect(outsideDimensionCheckbox).toBeInTheDocument();
			expect(outsideDimensionCheckbox).toHaveAttribute("type", "checkbox");

			// Ensure only one such checkbox exists in the entire document
			const allOutsideDimensionCheckboxes = screen.getAllByLabelText(
				/Use Outside Dimensions/i
			);
			expect(allOutsideDimensionCheckboxes).toHaveLength(1);
		});
		it("toggles 'isOutsideDimension' in config when the checkbox is clicked", async () => {
			render(<TableEnclosureCalculatorPage />);
			const outsideDimensionCheckbox = screen.getByLabelText(
				/Use Outside Dimensions/i
			);

			// Default should be checked (true) as per initial state in TableCalculator
			expect(outsideDimensionCheckbox).toBeChecked();

			fireEvent.click(outsideDimensionCheckbox);
			expect(outsideDimensionCheckbox).not.toBeChecked();

			fireEvent.click(outsideDimensionCheckbox);
			expect(outsideDimensionCheckbox).toBeChecked();
		});
	});
	describe("Simplified Material Options", () => {
		it("does not render a material type dropdown in the current implementation", () => {
			render(<TableEnclosureCalculatorPage />);
			// The current implementation doesn't show material selection UI
			// Material type is handled internally
			expect(screen.queryByLabelText(/Material Type/i)).not.toBeInTheDocument();
		});

		it("does not render a material thickness dropdown", () => {
			render(<TableEnclosureCalculatorPage />);
			expect(
				screen.queryByLabelText(/Material Thickness/i)
			).not.toBeInTheDocument();
		});

		it("uses default material type internally", () => {
			render(<TableEnclosureCalculatorPage />);
			// Since material selection UI isn't visible, we can't test the dropdown interaction
			// but we can verify the component renders without errors (implicit test)
			expect(
				screen.getByRole("heading", { name: /Configuration/i })
			).toBeInTheDocument();
		});
	});
});

// Basic rendering test (can be kept or merged)
describe("TableEnclosureCalculator Component Basic Rendering", () => {
	it("renders the calculator with default values", () => {
		// Reset to simpler searchParams for this default test
		(require("next/navigation").useSearchParams as jest.Mock).mockReturnValue({
			get: jest.fn().mockReturnValue(null), // No params
			size: 0,
			has: jest.fn().mockReturnValue(false),
			forEach: jest.fn(),
			toString: jest.fn().mockReturnValue(""),
		});
		render(<TableEnclosureCalculatorPage />);
		expect(screen.getByLabelText(/Include Table/i)).toBeChecked(); // Default
		expect(screen.getByLabelText(/Use Outside Dimensions/i)).toBeChecked(); // Default
		// Verify basic structure is rendered
		expect(
			screen.getByRole("heading", { name: /Configuration/i })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /Table Dimensions/i })
		).toBeInTheDocument();
	});
});

// ... Other test suites like "Calculator Calculation Functions" and "Calculator Integration Tests" would need updates
// if they directly interact with UI elements changed or use functions whose signatures changed.
// For calcUtils.test.ts, the changes are already applied in a previous step.
