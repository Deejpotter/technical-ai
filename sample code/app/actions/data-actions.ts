/**
 * Data Actions
 * Updated: 07/05/25
 * Author: Deej Potter
 * Description: Server actions for data operations using our unified data layer
 * These actions can be used from client components for any data operations
 */

"use server";

import { DatabaseResponse } from "../../types/mongodb/mongo-types";
import DataService from "@/utils/data/DataService";
import ShippingItem from "@/types/box-shipping-calculator/ShippingItem";

/**
 * Get all available shipping items
 * @returns DatabaseResponse containing ShippingItem array
 */
export async function getAvailableItems(): Promise<
	DatabaseResponse<ShippingItem[]>
> {
	return DataService.shippingItems.getAvailable();
}

/**
 * Add a new item to the database
 * @param item ShippingItem object to add (without _id)
 * @returns DatabaseResponse containing created item
 */
export async function addItemToDatabase(
	item: Omit<ShippingItem, "_id">
): Promise<DatabaseResponse<ShippingItem>> {
	return DataService.shippingItems.add(item);
}

/**
 * Update an existing item in the database
 * @param item ShippingItem object with updates
 * @returns DatabaseResponse containing updated item
 */
export async function updateItemInDatabase(
	item: ShippingItem
): Promise<DatabaseResponse<ShippingItem>> {
	return DataService.shippingItems.update(item);
}

/**
 * Soft delete an item by setting deletedAt timestamp
 * @param id ID of the item to delete
 * @returns DatabaseResponse containing deleted item
 */
export async function deleteItemFromDatabase(
	id: string
): Promise<DatabaseResponse<ShippingItem>> {
	return DataService.shippingItems.delete(id);
}

/**
 * Force sync with remote database
 * Useful for ensuring all local changes are synced to the server
 */
export async function syncWithRemoteDatabase(): Promise<
	DatabaseResponse<void>
> {
	try {
		await DataService.sync();
		console.log("Sync with remote database successful.");
		return {
			success: true,
			status: 200,
			message: "Sync successful",
		};
	} catch (error) {
		console.error("Sync with remote database failed:", error);
		return {
			success: false,
			status: 500,
			error: "Sync failed",
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Get user-specific data
 * @param collection Collection name
 * @param userId User ID
 * @returns DatabaseResponse containing user data
 */
export async function getUserData<T>(
	collection: string,
	userId: string
): Promise<DatabaseResponse<T[]>> {
	return DataService.userData.getAll<T>(collection, userId);
}

/**
 * Add user-specific data
 * @param collection Collection name
 * @param userId User ID
 * @param data Data to add
 * @returns DatabaseResponse containing created document
 */
export async function addUserData<T>(
	collection: string,
	userId: string,
	data: Omit<T, "_id">
): Promise<DatabaseResponse<T>> {
	return DataService.userData.add<T>(collection, userId, data);
}

/**
 * Update user-specific data
 * @param collection Collection name
 * @param userId User ID
 * @param id Document ID
 * @param update Update data
 * @returns DatabaseResponse containing updated document
 */
export async function updateUserData<T>(
	collection: string,
	userId: string,
	id: string,
	update: Partial<T>
): Promise<DatabaseResponse<T>> {
	return DataService.userData.update<T>(collection, userId, id, update);
}

/**
 * Delete user-specific data
 * @param collection Collection name
 * @param userId User ID
 * @param id Document ID
 * @returns DatabaseResponse containing deleted document
 */
export async function deleteUserData<T>(
	collection: string,
	userId: string,
	id: string
): Promise<DatabaseResponse<T>> {
	return DataService.userData.delete<T>(collection, userId, id);
}
