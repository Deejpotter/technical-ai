/**
 * MongoDB Data Provider Implementation
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file implements the DataProvider interface using MongoDB as the data source.
 *
 * NOTE: This file was migrated from sample code/utils/data/MongoDBProvider.ts
 * and adapted for backend use. Comments and logic have been preserved and improved.
 */

import { Collection, Db, ObjectId } from "mongodb";
import { getClientPromise, getCollection } from "./mongoClient"; // Adjusted import path
import { DatabaseResponse, MongoDocument } from "../types/mongodb"; // Adjusted import path
import {
	DataProvider,
	DataProviderOptions,
	DEFAULT_OPTIONS,
} from "./DataProvider"; // Adjusted import path

/**
 * MongoDB Data Provider
 * Implements the DataProvider interface for MongoDB
 */
export class MongoDBProvider implements DataProvider {
	/**
	 * Serializes MongoDB documents for consistent API responses.
	 * Converts ObjectId to string and ensures Date objects are in ISO string format.
	 * @template T - The type of the document, extending MongoDocument.
	 * @param {T | null | undefined} doc - The document to serialize.
	 * @returns {T | null | undefined} The serialized document.
	 */
	private serializeDocument<T extends MongoDocument>(
		doc: T | null | undefined
	): T | null | undefined {
		if (!doc) return doc;

		const serializedDoc: any = { ...doc };

		if (doc._id) {
			serializedDoc._id =
				typeof doc._id === "string" ? doc._id : doc._id.toString();
		}

		const dateFields: (keyof MongoDocument)[] = [
			"createdAt",
			"updatedAt",
			"deletedAt",
		];
		dateFields.forEach((field) => {
			if (doc[field] instanceof Date) {
				serializedDoc[field] = (doc[field] as Date).toISOString();
			} else if (doc[field] === null) {
				serializedDoc[field] = null;
			} else if (doc[field] === undefined) {
				delete serializedDoc[field]; // Remove undefined fields explicitly if that's desired
			}
		});

		return serializedDoc as T;
	}

	/**
	 * Serializes an array of MongoDB documents.
	 * @template T - The type of the documents, extending MongoDocument.
	 * @param {T[]} docs - The array of documents to serialize.
	 * @returns {T[]} The array of serialized documents.
	 */
	private serializeDocuments<T extends MongoDocument>(docs: T[]): T[] {
		return docs
			.map((doc) => this.serializeDocument(doc))
			.filter((doc) => doc !== null && doc !== undefined) as T[];
	}

	/**
	 * Prepares a collection name, appending userId if provided and not public.
	 * @param {string} collection - The base collection name.
	 * @param {DataProviderOptions} [options] - Options including userId and isPublic.
	 * @returns {string} The final collection name.
	 */
	private getCollectionName(
		collection: string,
		options?: DataProviderOptions
	): string {
		const opts = { ...DEFAULT_OPTIONS, ...options };
		if (opts.userId && !opts.isPublic) {
			// Consider a consistent naming convention, e.g., prefixing or specific separator
			return `${collection}_user_${opts.userId}`;
		}
		return collection;
	}

	/**
	 * Get all documents from a specified collection.
	 * @template T - The expected type of the documents.
	 * @param {string} collection - The name of the collection.
	 * @param {DataProviderOptions} [options] - Optional parameters for data fetching.
	 * @returns {Promise<DatabaseResponse<T[]>>} A promise resolving to the database response.
	 */
	async getAllDocuments<T extends MongoDocument>(
		collection: string,
		options?: DataProviderOptions
	): Promise<DatabaseResponse<T[]>> {
		console.log(
			`[MongoDBProvider] getAllDocuments called. collection: ${collection}`
		);
		try {
			const collectionName = this.getCollectionName(collection, options);
			const coll = await getCollection(collectionName);
			const documents = await coll.find({}).toArray();

			return {
				success: true,
				data: this.serializeDocuments(documents as unknown as T[]),
				status: 200,
				message: "Documents retrieved successfully",
			};
		} catch (error: any) {
			console.error(
				`[MongoDBProvider] Error fetching all documents from ${collection}:`,
				error
			);
			return {
				success: false,
				data: [], // Ensure data is an empty array on error
				error: `Failed to fetch all documents from ${collection}.`,
				status: 500,
				message: error.message || "An unknown error occurred",
			};
		}
	}

	/**
	 * Get documents from a collection based on a filter.
	 * @template T - The expected type of the documents.
	 * @param {string} collection - The name of the collection.
	 * @param {Record<string, any>} filter - The filter criteria.
	 * @param {DataProviderOptions} [options] - Optional parameters for data fetching.
	 * @returns {Promise<DatabaseResponse<T[]>>} A promise resolving to the database response.
	 */
	async getDocuments<T extends MongoDocument>(
		collection: string,
		filter: Record<string, any>,
		options?: DataProviderOptions
	): Promise<DatabaseResponse<T[]>> {
		try {
			const collectionName = this.getCollectionName(collection, options);
			const coll = await getCollection(collectionName);
			const documents = await coll.find(filter).toArray();

			return {
				success: true,
				data: this.serializeDocuments(documents as unknown as T[]),
				status: 200,
				message: "Documents retrieved successfully with filter",
			};
		} catch (error: any) {
			console.error(
				`Error fetching documents from ${collection} with filter:`,
				error
			);
			return {
				success: false,
				data: [], // Ensure data is an empty array on error
				error: `Failed to fetch documents from ${collection} with filter.`,
				status: 500,
				message: error.message || "An unknown error occurred",
			};
		}
	}

	/**
	 * Create a new document in a collection.
	 * @template T - The expected type of the document.
	 * @param {string} collection - The name of the collection.
	 * @param {Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">} document - The document data to insert.
	 * @param {DataProviderOptions} [options] - Optional parameters for data creation.
	 * @returns {Promise<DatabaseResponse<T>>} A promise resolving to the database response with the created document.
	 */
	async createDocument<T extends MongoDocument>(
		collection: string,
		document: Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">,
		options?: DataProviderOptions
	): Promise<DatabaseResponse<T>> {
		try {
			const collectionName = this.getCollectionName(collection, options);
			const coll = await getCollection(collectionName);

			const docToInsert = {
				...(document as T), // Cast to T, Omit was for type safety at call site
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};

			const result = await coll.insertOne(docToInsert as any);
			const insertedDoc = { ...docToInsert, _id: result.insertedId } as T;

			const serializedData = this.serializeDocument(insertedDoc);
			if (!serializedData) {
				throw new Error("Failed to serialize created document.");
			}

			return {
				success: true,
				data: serializedData,
				status: 201, // Created
				message: "Document created successfully",
			};
		} catch (error: any) {
			console.error(`Error creating document in ${collection}:`, error);
			return {
				success: false,
				error: `Failed to create document in ${collection}.`,
				status: 500,
				message: error.message || "An unknown error occurred",
			};
		}
	}

	/**
	 * Update an existing document in a collection.
	 * @template T - The expected type of the document.
	 * @param {string} collection - The name of the collection.
	 * @param {string} id - The ID of the document to update.
	 * @param {Partial<Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">>} update - The partial data to update.
	 * @param {DataProviderOptions} [options] - Optional parameters for data update.
	 * @returns {Promise<DatabaseResponse<T>>} A promise resolving to the database response with the updated document.
	 */
	async updateDocument<T extends MongoDocument>(
		collection: string,
		id: string,
		update: Partial<Omit<T, "_id" | "createdAt" | "updatedAt" | "deletedAt">>,
		options?: DataProviderOptions
	): Promise<DatabaseResponse<T>> {
		try {
			const collectionName = this.getCollectionName(collection, options);
			const coll = await getCollection(collectionName);
			const objectId = new ObjectId(id);

			const updatePayload = {
				$set: {
					...(update as Partial<MongoDocument>),
					updatedAt: new Date(),
				},
			};

			const result = await coll.findOneAndUpdate(
				{ _id: objectId },
				updatePayload,
				{ returnDocument: "after" }
			);

			if (!result) {
				return {
					success: false,
					error: "Document not found",
					status: 404, // Not Found
					message: `Document with ID ${id} not found in ${collectionName}.`,
				};
			}
			const serializedData = this.serializeDocument(result as unknown as T);
			if (!serializedData) {
				throw new Error("Failed to serialize updated document.");
			}

			return {
				success: true,
				data: serializedData,
				status: 200,
				message: "Document updated successfully",
			};
		} catch (error: any) {
			console.error(`Error updating document ${id} in ${collection}:`, error);
			return {
				success: false,
				error: `Failed to update document ${id} in ${collection}.`,
				status: 500,
				message: error.message || "An unknown error occurred",
			};
		}
	}

	/**
	 * Delete a document from a collection (soft delete by setting deletedAt).
	 * @template T - The expected type of the document.
	 * @param {string} collection - The name of the collection.
	 * @param {string} id - The ID of the document to delete.
	 * @param {DataProviderOptions} [options] - Optional parameters for data deletion.
	 * @returns {Promise<DatabaseResponse<T>>} A promise resolving to the database response with the soft-deleted document.
	 */
	async deleteDocument<T extends MongoDocument>(
		collection: string,
		id: string,
		options?: DataProviderOptions
	): Promise<DatabaseResponse<T>> {
		try {
			const collectionName = this.getCollectionName(collection, options);
			const coll = await getCollection(collectionName);
			const objectId = new ObjectId(id);

			const result = await coll.findOneAndUpdate(
				{ _id: objectId },
				{
					$set: {
						deletedAt: new Date(),
						updatedAt: new Date(),
					},
				},
				{ returnDocument: "after" }
			);

			if (!result) {
				return {
					success: false,
					error: "Document not found for deletion",
					status: 404,
					message: `Document with ID ${id} not found in ${collectionName} for deletion.`,
				};
			}
			const serializedData = this.serializeDocument(result as unknown as T);
			if (!serializedData) {
				throw new Error("Failed to serialize soft-deleted document.");
			}

			return {
				success: true,
				data: serializedData,
				status: 200,
				message: "Document soft-deleted successfully",
			};
		} catch (error: any) {
			console.error(
				`Error soft-deleting document ${id} in ${collection}:`,
				error
			);
			return {
				success: false,
				error: `Failed to soft-delete document ${id} in ${collection}.`,
				status: 500,
				message: error.message || "An unknown error occurred",
			};
		}
	}

	/**
	 * Pings the database to check connectivity.
	 * @returns {Promise<DatabaseResponse<{ ok: number } | null>>} A promise resolving to the ping status.
	 */
	async ping(): Promise<DatabaseResponse<{ ok: number } | null>> {
		try {
			const client = await getClientPromise();
			const dbAdmin = client.db().admin();
			const pingResult = await dbAdmin.ping(); // pingResult is Document, e.g. { ok: 1.0 }

			if (
				pingResult &&
				typeof pingResult.ok === "number" &&
				pingResult.ok === 1
			) {
				return {
					success: true,
					data: { ok: 1 },
					status: 200,
					message: "Database ping successful",
				};
			} else {
				return {
					success: false,
					data:
						pingResult && typeof pingResult.ok === "number"
							? { ok: pingResult.ok }
							: null, // Attempt to extract ok if it's a number
					error: "Database ping failed",
					status: 500,
					message: "Database ping returned an unexpected result.",
				};
			}
		} catch (error: any) {
			console.error("Error pinging database:", error);
			return {
				success: false,
				data: null,
				error: "Database ping failed with an exception.",
				status: 500,
				message: error.message || "An unknown error occurred during ping",
			};
		}
	}

	/**
	 * Optional method to synchronize with a remote data source.
	 * For MongoDBProvider, operations are typically direct, so this is a conceptual placeholder.
	 * @returns {Promise<void>} A promise resolving when the conceptual sync is complete.
	 */
	async syncWithRemote(): Promise<void> {
		console.log(
			"MongoDBProvider: syncWithRemote called. Operations are generally direct with MongoDB."
		);
		// This is a no-op for MongoDB if all operations are live.
		// If there were a specific sync action (e.g., with a replica or another system),
		// it would be implemented here.
		// Conforms to DataProvider interface: () => Promise<void>
		return Promise.resolve();
	}
}
