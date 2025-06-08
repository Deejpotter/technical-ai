/**
 * Data Provider Interface
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file defines the TypeScript interface for the main data provider.
 * It includes methods for CRUD operations on MongoDB collections.
 */
import { DatabaseResponse, MongoDocument } from "../types/mongodb"; // Adjusted import path

/**
 * Data Provider Interface
 * Defines methods that all data providers must implement
 * This enables switching between storage options without changing business logic
 */
export interface DataProvider {
	/**
	 * Get all documents from a collection
	 */
	getAllDocuments: <T extends MongoDocument>( // Constrained T
		collection: string,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T[]>>;

	/**
	 * Get documents from a collection based on a filter
	 */
	getDocuments: <T extends MongoDocument>( // Constrained T
		collection: string,
		filter: Record<string, any>,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T[]>>;

	/**
	 * Create a new document in a collection
	 */
	createDocument: <T extends MongoDocument>( // Constrained T
		collection: string,
		document: Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">, // Ensure these are handled by provider
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T>>;

	/**
	 * Update a document in a collection
	 */
	updateDocument: <T extends MongoDocument>( // Constrained T
		collection: string,
		id: string,
		update: Partial<Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">>, // User cannot update these directly
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T>>;

	/**
	 * Delete a document from a collection (soft delete if applicable, or hard delete)
	 */
	deleteDocument: <T extends MongoDocument>( // Constrained T
		collection: string,
		id: string,
		options?: DataProviderOptions
	) => Promise<DatabaseResponse<T>>; // Response might indicate success/failure or return the deleted item

	/**
	 * Optional: Sync local changes with the remote database if applicable
	 */
	syncWithRemote?: () => Promise<void>;

	/**
	 * Optional: Ping the database to check connectivity.
	 */
	ping?: () => Promise<DatabaseResponse<{ ok: number } | null>>;
}

/**
 * Options for data provider operations
 * These can be extended based on specific provider needs
 */
export interface DataProviderOptions {
	/**
	 * User ID for user-specific data.
	 * This helps in multi-tenant scenarios or user-specific storage.
	 */
	userId?: string;

	/**
	 * Whether to use local storage (e.g., for caching or offline capabilities).
	 * This might not be relevant for a pure backend service.
	 */
	useLocalStorage?: boolean; // May be deprecated or unused in backend context

	/**
	 * Whether to use remote database.
	 * Typically true for backend services.
	 */
	useRemote?: boolean;

	/**
	 * Whether data is public (accessible to all).
	 * Useful for shared resources vs. private user data.
	 */
	isPublic?: boolean;
}

/**
 * Default options for data providers
 * Provides sensible defaults for common operations.
 */
export const DEFAULT_OPTIONS: DataProviderOptions = {
	useLocalStorage: false, // Backend services usually don't use client-side local storage
	useRemote: true, // Default to using the remote database
	isPublic: false, // Data is not public by default
};
