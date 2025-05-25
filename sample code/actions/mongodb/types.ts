/**
 * MongoDB Types and Interfaces
 * Updated: 30/03/25
 * Author: Deej Potter
 * Description: Defines types and interfaces for MongoDB documents and responses.
 */

import { ObjectId, WithId } from "mongodb";

/**
 * Base interface for all MongoDB documents
 * Includes common fields that all documents should have
 */
export interface MongoDocument {
	/**
	 * MongoDB ObjectId of the document
	 * Can be string when serialized for client-side use
	 */
	_id?: ObjectId | string;

	/**
	 * Timestamp when the document was created
	 * Automatically set by MongoDB actions
	 */
	createdAt?: Date;

	/**
	 * Timestamp when the document was last updated
	 * Automatically updated by MongoDB actions
	 */
	updatedAt?: Date;

	/**
	 * Timestamp when the document was soft deleted
	 * Null if the document is active
	 */
	deletedAt?: Date | null;
}

/**
 * Standard response format for database operations
 * Provides consistent error handling and type safety
 */
export interface DatabaseResponse<T> {
	/** Indicates if the operation was successful */
	success: boolean;

	/** The data returned by the operation */
	data?: T;

	/** Error message if the operation failed */
	error?: string;

	/** HTTP status code for the operation */
	status: number;

	/** Human-readable message about the operation result */
	message: string;
}

/** Type helper for MongoDB documents with required ID */
export type MongoDocumentWithId<T> = WithId<T & MongoDocument>;
