// Set a mock API key for testing before importing the module
process.env.OPENAI_API_KEY = "test-api-key";

// Mock OpenAI for testing to avoid API key issues
jest.mock("openai", () => {
	return jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: jest.fn().mockResolvedValue({
					choices: [{ message: { content: "[]" } }],
				}),
			},
		},
	}));
});

import {
	extractTextFromFile,
	removePersonalData,
	processInvoiceFileModular,
} from "../services/invoiceService";

describe("Invoice Processing Modular Workflow", () => {
	it("removes personal data from text", () => {
		const text = "John Doe\njohn@example.com\n555-123-4567\n123 Main St.";
		const scrubbed = removePersonalData(text);
		// Note: Name removal is not implemented yet, only email, phone, and address
		expect(scrubbed).not.toContain("john@example.com");
		expect(scrubbed).not.toContain("555-123-4567");
		expect(scrubbed).not.toContain("123 Main St.");
		expect(scrubbed).toContain("[REDACTED_EMAIL]");
		expect(scrubbed).toContain("[REDACTED_PHONE]");
		expect(scrubbed).toContain("[REDACTED_ADDRESS]");
	});

	it("extracts text from buffer", async () => {
		const textBuffer = Buffer.from("Test invoice content", "utf8");
		const extractedText = await extractTextFromFile(
			textBuffer,
			"text/plain",
			"test.txt"
		);
		expect(extractedText).toBe("Test invoice content");
	});

	it("processInvoiceFileModular handles empty extraction gracefully", async () => {
		// Test that the function doesn't crash when AI returns empty results
		const textBuffer = Buffer.from("Some text that returns no items", "utf8");
		const result = await processInvoiceFileModular(
			textBuffer,
			"text/plain",
			"test-empty.txt"
		);

		// Should return empty array, not crash
		expect(result).toEqual([]);
	});

	// Add more comprehensive tests when we have better mocking setup
	// The main fix (unsafe array destructuring) has been applied to the actual code

	// Add more tests for processInvoiceFileModular as needed
});
