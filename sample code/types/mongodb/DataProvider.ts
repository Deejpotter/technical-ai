/**
 * Data Provider Interface
 * Updated: 07/05/25
 * Author: Deej Potter
 * Description: Defines the interface for all data providers (MongoDB, localStorage, etc.)
 * This abstraction allows us to switch between data sources transparently.
 */

import { DatabaseResponse } from "@/types/mongodb/mongo-types";

/**
 * Data Provider Interface
 * Defines methods that all data providers must implement
 * This enables switching between storage options without changing business logic
 */
export interface DataProvider {
	/**
	 * Get all documents from a collection
	 */
	getAllDocuments: <T>(
		collection: string,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T[]>>;

	/**
	 * Get documents from a collection based on a filter
	 */
	getDocuments: <T>(
		collection: string,
		filter: Record<string, any>,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T[]>>;

	/**
	 * Create a new document in a collection
	 */
	createDocument: <T>(
		collection: string,
		document: Omit<T, "_id">,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T>>;

	/**
	 * Update a document in a collection
	 */
	updateDocument: <T>(
		collection: string,
		id: string,
		update: Partial<T>,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T>>;

	/**
	 * Delete a document from a collection (soft delete)
	 */
	deleteDocument: <T>(
		collection: string,
		id: string,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T>>;

	/**
	 * Sync local changes with the remote database
	 */
	syncWithRemote?: () => Promise<void>;
}

/**
 * Options for data provider operations
 */
export interface DataProviderOptions {
	/**
	 * Whether to store data for a specific user
	 */
	userId?: string;

	/**
	 * Whether to use local storage
	 */
	useLocalStorage?: boolean;

	/**
	 * Whether to use remote database
	 */
	useRemote?: boolean;

	/**
	 * Whether data is public (accessible to all)
	 */
	isPublic?: boolean;
}

/**
 * Default options for data providers
 */
export const DEFAULT_OPTIONS: DataProviderOptions = {
	useLocalStorage: false, // Changed to false
	useRemote: true,
	isPublic: false,
};
