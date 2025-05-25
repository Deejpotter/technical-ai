/**
 * Tests for Data Actions
 */

import {
	getAvailableItems,
	addItemToDatabase,
	updateItemInDatabase,
	deleteItemFromDatabase,
	syncWithRemoteDatabase,
} from "./data-actions";
import DataService from "@/utils/data/DataService";

// Mock the DataService module
jest.mock("@/utils/data/DataService", () => ({
	shippingItems: {
		getAvailable: jest.fn(),
		add: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	sync: jest.fn(),
	userData: {
		getAll: jest.fn(),
		add: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
}));

describe("Data Actions", () => {
	// Reset all mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getAvailableItems", () => {
		it("should call DataService.shippingItems.getAvailable and return its result", async () => {
			// Arrange
			const mockItems = [
				{
					_id: "1",
					name: "Item 1",
					length: 10,
					width: 10,
					height: 10,
					weight: 100,
				},
				{
					_id: "2",
					name: "Item 2",
					length: 20,
					width: 20,
					height: 20,
					weight: 200,
				},
			];
			const mockResponse = { success: true, data: mockItems, error: null };
			(DataService.shippingItems.getAvailable as jest.Mock).mockResolvedValue(
				mockResponse
			);

			// Act
			const result = await getAvailableItems();

			// Assert
			expect(DataService.shippingItems.getAvailable).toHaveBeenCalledTimes(1);
			expect(result).toEqual(mockResponse);
			expect(result.data).toHaveLength(2);
		});

		it("should handle errors from DataService", async () => {
			// Arrange
			const mockError = "Failed to fetch items";
			const mockResponse = { success: false, data: null, error: mockError };
			(DataService.shippingItems.getAvailable as jest.Mock).mockResolvedValue(
				mockResponse
			);

			// Act
			const result = await getAvailableItems();

			// Assert
			expect(DataService.shippingItems.getAvailable).toHaveBeenCalledTimes(1);
			expect(result).toEqual(mockResponse);
			expect(result.success).toBe(false);
			expect(result.error).toBe(mockError);
		});
	});

	describe("addItemToDatabase", () => {
		it("should call DataService.shippingItems.add with the correct item", async () => {
			// Arrange
			const newItem = {
				name: "New Item",
				length: 30,
				width: 30,
				height: 30,
				weight: 300,
			};
			const createdItem = { _id: "3", ...newItem };
			const mockResponse = { success: true, data: createdItem, error: null };
			(DataService.shippingItems.add as jest.Mock).mockResolvedValue(
				mockResponse
			);

			// Act
			const result = await addItemToDatabase(newItem);

			// Assert
			expect(DataService.shippingItems.add).toHaveBeenCalledWith(newItem);
			expect(result).toEqual(mockResponse);
			expect(result.data._id).toBe("3");
		});
	});

	describe("updateItemInDatabase", () => {
		it("should call DataService.shippingItems.update with the correct item", async () => {
			// Arrange
			const updatedItem = {
				_id: "1",
				name: "Updated Item",
				length: 40,
				width: 40,
				height: 40,
				weight: 400,
			};
			const mockResponse = { success: true, data: updatedItem, error: null };
			(DataService.shippingItems.update as jest.Mock).mockResolvedValue(
				mockResponse
			);

			// Act
			const result = await updateItemInDatabase(updatedItem);

			// Assert
			expect(DataService.shippingItems.update).toHaveBeenCalledWith(
				updatedItem
			);
			expect(result).toEqual(mockResponse);
			expect(result.data.name).toBe("Updated Item");
		});
	});

	describe("deleteItemFromDatabase", () => {
		it("should call DataService.shippingItems.delete with the correct id", async () => {
			// Arrange
			const itemId = "1";
			const deletedItem = {
				_id: "1",
				name: "Item 1",
				length: 10,
				width: 10,
				height: 10,
				weight: 100,
				deletedAt: "2025-05-07T12:00:00Z",
			};
			const mockResponse = { success: true, data: deletedItem, error: null };
			(DataService.shippingItems.delete as jest.Mock).mockResolvedValue(
				mockResponse
			);

			// Act
			const result = await deleteItemFromDatabase(itemId);

			// Assert
			expect(DataService.shippingItems.delete).toHaveBeenCalledWith(itemId);
			expect(result).toEqual(mockResponse);
			expect(result.data.deletedAt).toBeTruthy();
		});
	});

	describe("syncWithRemoteDatabase", () => {
		it("should log success when sync is successful", async () => {
			// Arrange
			const consoleLogSpy = jest
				.spyOn(console, "log")
				.mockImplementation(() => {});
			(DataService.sync as jest.Mock).mockResolvedValueOnce(undefined);

			// Act
			const result = await syncWithRemoteDatabase();

			// Assert
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Sync with remote database successful."
			);
			expect(result.success).toBe(true);
			expect(result.message).toBe("Sync successful");

			// Cleanup
			consoleLogSpy.mockRestore();
		});

		it("should log error and return failure when sync fails", async () => {
			// Arrange
			const consoleErrorSpy = jest
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const errorMessage = "Network error";
			(DataService.sync as jest.Mock).mockRejectedValueOnce(
				new Error(errorMessage)
			);

			// Act
			const result = await syncWithRemoteDatabase();

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Sync with remote database failed:",
				expect.any(Error)
			);
			expect(result.success).toBe(false);
			expect(result.message).toBe(errorMessage);

			// Cleanup
			consoleErrorSpy.mockRestore();
		});
	});
});
