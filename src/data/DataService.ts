/**
 * Data Service
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file contains the DataService class, responsible for orchestrating data interactions with the underlying data provider.
 */

/**
 * Data Service (migrated from sample code)
 * Updated: 2025-06-08
 * Author: Deej Potter (original), migrated by Daniel
 * Description: Centralized service for data operations across the backend API.
 * Provides specialized methods for each domain model and user-specific data.
 *
 * NOTE: This file was migrated from sample code/utils/data/DataService.ts
 * and adapted for backend use. Comments and logic have been preserved and improved.
 */

import ShippingItem from "../types/ShippingItem"; // Adjusted import path
import { DatabaseResponse, MongoDocument } from "../types/mongodb"; // Adjusted import path
import {
	DataProvider,
	DataProviderOptions,
	DEFAULT_OPTIONS,
} from "./DataProvider"; // Corrected import
import { MongoDBProvider } from "./MongoDBProvider";

// Singleton instance of the MongoDB provider, typed as DataProvider
const dataProvider: DataProvider = new MongoDBProvider();

/**
 * Data Service
 * Provides specialized methods for each domain model
 */
export const DataService = {
	/**
	 * Initialize the data service - call this early in the application lifecycle
	 * Can be used to perform any necessary setup like loading initial data
	 */
	initialize: async (): Promise<void> => {
		console.log("[DataService] initialize called.");
		console.log("DataService initialized.");
	},

	/**
	 * Force sync with remote database
	 * This specific implementation detail might need to be re-evaluated
	 * based on the capabilities of the chosen DataProvider.
	 * The MongoDBProvider, as implemented, operates directly on the database,
	 * so a manual "sync" operation might not be applicable in the same way
	 * it was in the original sample code (which might have had local caching).
	 * If the DataProvider interface had a `sync` method, it would be called here.
	 * For now, this is a conceptual placeholder.
	 */
	syncWithRemote: async (): Promise<DatabaseResponse<void>> => {
		try {
			// dataProvider is now typed as DataProvider, so syncWithRemote is available if defined in the interface
			if (dataProvider.syncWithRemote) {
				// Check if the method exists on the provider instance
				await dataProvider.syncWithRemote(); // This now correctly calls the method on the interface type
				console.log("Sync with remote database successful via provider.");
				return {
					success: true,
					status: 200,
					message: "Sync successful via provider.",
				};
			} else {
				// This case should ideally not be hit if syncWithRemote is mandatory or handled gracefully by provider
				console.warn(
					"Sync with remote database: syncWithRemote method not found on provider."
				);
				return {
					success: false,
					status: 501, // Not Implemented
					error: "Sync method not implemented on provider",
					message:
						"syncWithRemote is not available on the configured data provider.",
				};
			}
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
			// Assumes 'Items' is the collection name and soft delete is handled by 'deletedAt: null'
			return dataProvider.getDocuments<ShippingItem>("Items", {
				deletedAt: null,
			});
		},

		/**
		 * Add a new shipping item
		 */
		add: async (
			item: Omit<ShippingItem, "_id" | "createdAt" | "updatedAt" | "deletedAt">
		): Promise<DatabaseResponse<ShippingItem>> => {
			// MongoDBProvider's createDocument handles adding createdAt, updatedAt and ensuring deletedAt is null for new items.
			return dataProvider.createDocument<ShippingItem>("Items", item);
		},

		/**
		 * Update an existing shipping item
		 */
		update: async (
			item: ShippingItem // Expects a full ShippingItem, _id is mandatory for an update
		): Promise<DatabaseResponse<ShippingItem>> => {
			if (!item._id) {
				return {
					success: false,
					error: "Update failed: ShippingItem _id is missing.",
					status: 400,
					message: "Cannot update item without a valid _id.",
				};
			}
			const { _id, createdAt, updatedAt, deletedAt, ...updateData } = item;
			// MongoDBProvider's updateDocument handles updating updatedAt
			// We pass only the fields that are allowed to be updated.
			return dataProvider.updateDocument<ShippingItem>(
				"Items",
				_id.toString(), // _id is checked and exists here
				updateData as Partial<
					Omit<ShippingItem, "_id" | "createdAt" | "updatedAt" | "deletedAt">
				>
			);
		},

		/**
		 * Delete a shipping item (soft delete)
		 */
		delete: async (id: string): Promise<DatabaseResponse<ShippingItem>> => {
			// MongoDBProvider's deleteDocument handles the soft delete by setting deletedAt
			return dataProvider.deleteDocument<ShippingItem>("Items", id);
		},
	},

	/**
	 * User-specific data API
	 * Use these methods for data that should be associated with a specific user
	 * Note: For backend, userId might come from authenticated session or request context
	 */
	userData: {
		/**
		 * Get all documents from a user-specific collection
		 */
		getAll: async <T extends MongoDocument>( // Constrain T
			collection: string,
			userId: string, // userId is mandatory for these operations
			options?: Omit<DataProviderOptions, "userId" | "isPublic"> // Filter out options managed internally
		): Promise<DatabaseResponse<T[]>> => {
			return dataProvider.getAllDocuments<T>(collection, {
				...DEFAULT_OPTIONS,
				...options,
				userId,
				isPublic: false, // User data is not public
			});
		},

		/**
		 * Get filtered documents from a user-specific collection
		 */
		getFiltered: async <T extends MongoDocument>( // Constrain T
			collection: string,
			userId: string,
			filter: Record<string, any>,
			options?: Omit<DataProviderOptions, "userId" | "isPublic">
		): Promise<DatabaseResponse<T[]>> => {
			return dataProvider.getDocuments<T>(collection, filter, {
				...DEFAULT_OPTIONS,
				...options,
				userId,
				isPublic: false,
			});
		},

		/**
		 * Add a document to a user-specific collection
		 */
		add: async <T extends MongoDocument>( // Constrain T
			collection: string,
			userId: string,
			document: Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">,
			options?: Omit<DataProviderOptions, "userId" | "isPublic">
		): Promise<DatabaseResponse<T>> => {
			return dataProvider.createDocument<T>(collection, document, {
				...DEFAULT_OPTIONS,
				...options,
				userId,
				isPublic: false,
			});
		},

		/**
		 * Update a document in a user-specific collection
		 */
		update: async <T extends MongoDocument>( // Constrain T
			collection: string,
			userId: string,
			id: string,
			update: Partial<Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">>,
			options?: Omit<DataProviderOptions, "userId" | "isPublic">
		): Promise<DatabaseResponse<T>> => {
			return dataProvider.updateDocument<T>(collection, id, update, {
				...DEFAULT_OPTIONS,
				...options,
				userId,
				isPublic: false,
			});
		},

		/**
		 * Delete a document from a user-specific collection
		 */
		delete: async <T extends MongoDocument>( // Constrain T
			collection: string,
			userId: string,
			id: string,
			options?: Omit<DataProviderOptions, "userId" | "isPublic">
		): Promise<DatabaseResponse<T>> => {
			return dataProvider.deleteDocument<T>(collection, id, {
				...DEFAULT_OPTIONS,
				...options,
				userId,
				isPublic: false,
			});
		},
	},

	/**
	 * Checks the database connection status by pinging the database.
	 * Assumes MongoDBProvider has a ping method.
	 */
	checkDbConnection: async (): Promise<
		DatabaseResponse<{ ok: number } | null>
	> => {
		if (typeof dataProvider.ping === "function") {
			return dataProvider.ping();
		} else {
			// Fallback if ping is not implemented on the provider
			console.warn("Ping function not available on the current data provider.");
			return Promise.resolve({
				success: false,
				message: "Ping function not available on provider.",
				error: "Not Implemented",
				status: 501, // Not Implemented
				data: null,
			});
		}
	},

	/**
	 * Access to the raw data provider for advanced operations or direct access if needed.
	 * Use with caution as it bypasses the DataService abstraction.
	 */
	provider: dataProvider,
};

export default DataService;
