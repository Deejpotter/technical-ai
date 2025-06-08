/**
 * Data Service
 * Updated: 07/05/25
 * Author: Deej Potter
 * Description: Centralized service for data operations across the application
 * Makes it easy to access data with the appropriate provider and options
 */

import ShippingItem from "@/types/box-shipping-calculator/ShippingItem";
import { DatabaseResponse } from "@/types/mongodb/mongo-types";
import { DataProviderOptions } from "../../types/mongodb/DataProvider";
import { MongoDBProvider } from "./MongoDBProvider"; // Added

// Singleton instance of the hybrid provider
const dataProvider = new MongoDBProvider(); // Changed to MongoDBProvider

/**
 * Data Service
 * Provides specialized methods for each domain model
 */
export const DataService = {
	/**
	 * Initialize the data service - call this early in the application lifecycle
	 * Can be used to perform any necessary setup like loading initial data
	 */
	initialize: async () => {
		// Trigger sync with remote on initialization
		// MongoDBProvider does not have syncWithRemote
		// await dataProvider.syncWithRemote?.();
	},

	/**
	 * Box Shipping Calculator API
	 * Specialized methods for ShippingItem operations
	 */
	shippingItems: {
		/**
		 * Get all available (non-deleted) shipping items
		 */
		getAvailable: async (): Promise<DatabaseResponse<ShippingItem[]>> => {
			// Use generic getDocuments method from MongoDBProvider
			return dataProvider.getDocuments<ShippingItem>("Items", {
				deletedAt: null,
			});
		},

		/**
		 * Add a new shipping item
		 */
		add: async (
			item: Omit<ShippingItem, "_id">
		): Promise<DatabaseResponse<ShippingItem>> => {
			// Use generic createDocument method from MongoDBProvider
			// MongoDBProvider's createDocument handles adding createdAt and updatedAt
			return dataProvider.createDocument<ShippingItem>("Items", {
				...item,
				deletedAt: null,
			});
		},

		/**
		 * Update an existing shipping item
		 */
		update: async (
			item: ShippingItem
		): Promise<DatabaseResponse<ShippingItem>> => {
			// Use generic updateDocument method from MongoDBProvider
			const { _id, ...updateData } = item;
			// MongoDBProvider's updateDocument handles updating updatedAt
			return dataProvider.updateDocument<ShippingItem>(
				"Items",
				_id.toString(),
				updateData
			);
		},

		/**
		 * Delete a shipping item (soft delete)
		 */
		delete: async (id: string): Promise<DatabaseResponse<ShippingItem>> => {
			// Use generic deleteDocument method from MongoDBProvider
			// MongoDBProvider's deleteDocument handles the soft delete by setting deletedAt
			return dataProvider.deleteDocument<ShippingItem>("Items", id.toString());
		},
	},

	/**
	 * User-specific data API
	 * Use these methods for data that should be associated with a specific user
	 */
	userData: {
		/**
		 * Get all documents from a user-specific collection
		 */
		getAll: async <T>(
			collection: string,
			userId: string
		): Promise<DatabaseResponse<T[]>> => {
			return dataProvider.getAllDocuments<T>(collection, {
				userId,
				isPublic: false,
			});
		},

		/**
		 * Get filtered documents from a user-specific collection
		 */
		getFiltered: async <T>(
			collection: string,
			userId: string,
			filter: Record<string, any>
		): Promise<DatabaseResponse<T[]>> => {
			return dataProvider.getDocuments<T>(collection, filter, {
				userId,
				isPublic: false,
			});
		},

		/**
		 * Add a document to a user-specific collection
		 */
		add: async <T>(
			collection: string,
			userId: string,
			document: Omit<T, "_id">
		): Promise<DatabaseResponse<T>> => {
			return dataProvider.createDocument<T>(collection, document, {
				userId,
				isPublic: false,
			});
		},

		/**
		 * Update a document in a user-specific collection
		 */
		update: async <T>(
			collection: string,
			userId: string,
			id: string,
			update: Partial<T>
		): Promise<DatabaseResponse<T>> => {
			return dataProvider.updateDocument<T>(collection, id, update, {
				userId,
				isPublic: false,
			});
		},

		/**
		 * Delete a document from a user-specific collection
		 */
		delete: async <T>(
			collection: string,
			userId: string,
			id: string
		): Promise<DatabaseResponse<T>> => {
			return dataProvider.deleteDocument<T>(collection, id, {
				userId,
				isPublic: false,
			});
		},
	},

	/**
	 * Force sync with remote database
	 */
	sync: async (): Promise<void> => {
		// MongoDBProvider does not have syncWithRemote
		// return dataProvider.syncWithRemote?.();
		return Promise.resolve(); // Or implement a health check if needed
	},

	/**
	 * Checks the database connection status by pinging the database.
	 */
	checkDbConnection: async (): Promise<DatabaseResponse<{ ok: number }>> => {
		if (typeof dataProvider.ping === "function") {
			return dataProvider.ping();
		} else {
			return Promise.resolve({
				success: false,
				error: "Ping function not available on provider.",
				status: 500,
				message: "Ping function not available on provider.",
			});
		}
	},

	/**
	 * Access to the raw data provider for advanced operations
	 */
	provider: dataProvider,
};

export default DataService;
