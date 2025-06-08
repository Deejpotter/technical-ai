/**
 * MongoDB Actions
 * Updated: 30/03/25
 * Author: Deej Potter
 * Description: Provides server-side Next.js actions for MongoDB operations.
 * Uses connection pooling and typed responses for better reliability.
 */

"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "./client";
import {
	DatabaseResponse,
	MongoDocument,
	MongoDocumentWithId,
} from "../../../types/mongodb/mongo-types";
import ShippingItem from "@/types/box-shipping-calculator/ShippingItem";

/**
 * Serializes MongoDB documents for client-side use
 * Converts ObjectId to string and handles Date objects
 * @param doc Document to serialize
 * @returns Serialized document safe for client components
 */
function serializeDocument<T extends MongoDocument>(doc: T): T {
	if (!doc) return doc;

	// Ensure _id is converted to string only if it's an ObjectId
	const idString = typeof doc._id === "string" ? doc._id : doc._id?.toString();

	// Ensure date fields are converted to ISOString only if they are Date objects
	const createdAtString =
		doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt;
	const updatedAtString =
		doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt;
	const deletedAtString =
		doc.deletedAt instanceof Date
			? doc.deletedAt.toISOString()
			: doc.deletedAt === undefined
			? undefined
			: null;

	return {
		...doc,
		_id: idString,
		createdAt: createdAtString,
		updatedAt: updatedAtString,
		deletedAt:
			deletedAtString === undefined ? undefined : deletedAtString || null, // Handle undefined and null explicitly
	} as T;
}

/**
 * Serializes an array of MongoDB documents
 * @param docs Array of documents to serialize
 * @returns Array of serialized documents
 */
function serializeDocuments<T extends MongoDocument>(docs: T[]): T[] {
	return docs.map((doc) => serializeDocument(doc));
}

/**
 * Get all documents from a specified collection
 * @param collection Name of the collection to query
 * @returns DatabaseResponse containing either data or error
 */
export async function getAllDocuments<T extends MongoDocument>(
	collection: string
): Promise<DatabaseResponse<T[]>> {
	try {
		const coll = await getCollection(collection);
		const documents = await coll.find({}).toArray();
		return {
			success: true,
			data: serializeDocuments(documents as T[]),
			status: 200,
			message: "Documents retrieved successfully",
		};
	} catch (error) {
		console.error("Error fetching documents:", error);
		return {
			success: false,
			error: "Failed to fetch documents",
			status: 500,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Create a new document in the specified collection
 * @param collection Name of the collection
 * @param document Document to create
 * @returns DatabaseResponse containing created document
 */
export async function createDocument<T extends MongoDocument>(
	collection: string,
	document: Omit<T, "_id">
): Promise<DatabaseResponse<T>> {
	try {
		const coll = await getCollection(collection);
		const docToInsert = {
			...document,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await coll.insertOne(docToInsert);
		const insertedDoc = { ...docToInsert, _id: result.insertedId } as T;

		return {
			success: true,
			data: serializeDocument(insertedDoc),
			status: 201,
			message: "Document created successfully",
		};
	} catch (error) {
		console.error("Error creating document:", error);
		return {
			success: false,
			error: "Failed to create document",
			status: 500,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Update an existing document in the specified collection
 * @param collection Name of the collection
 * @param id ObjectId of the document to update
 * @param update Update object containing the changes
 * @returns DatabaseResponse containing updated document
 */
export async function updateDocument<T extends MongoDocument>(
	collection: string,
	id: string | ObjectId,
	update: Partial<T>
): Promise<DatabaseResponse<T>> {
	try {
		const coll = await getCollection(collection);
		const objectId = typeof id === "string" ? new ObjectId(id) : id;

		const result = await coll.findOneAndUpdate(
			{ _id: objectId },
			{
				$set: {
					...update,
					updatedAt: new Date(),
				},
			},
			{ returnDocument: "after" }
		);

		if (!result) {
			return {
				success: false,
				error: "Document not found",
				status: 404,
				message: "No document found with the specified ID",
			};
		}

		return {
			success: true,
			data: serializeDocument(result as T),
			status: 200,
			message: "Document updated successfully",
		};
	} catch (error) {
		console.error("Error updating document:", error);
		return {
			success: false,
			error: "Failed to update document",
			status: 500,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Soft delete a document by setting deletedAt timestamp
 * @param collection Name of the collection
 * @param id ObjectId of the document to delete
 * @returns DatabaseResponse containing deleted document
 */
export async function deleteDocument<T extends MongoDocument>(
	collection: string,
	id: string | ObjectId
): Promise<DatabaseResponse<T>> {
	try {
		const coll = await getCollection(collection);
		const objectId = typeof id === "string" ? new ObjectId(id) : id;

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
				error: "Document not found",
				status: 404,
				message: "No document found with the specified ID",
			};
		}

		return {
			success: true,
			data: serializeDocument(result as T),
			status: 200,
			message: "Document deleted successfully",
		};
	} catch (error) {
		console.error("Error deleting document:", error);
		return {
			success: false,
			error: "Failed to delete document",
			status: 500,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

// Specialized functions for ShippingItems

/**
 * Get all available (non-deleted) items from the database
 * @returns DatabaseResponse containing ShippingItem array
 */
export async function getAvailableItems(): Promise<
	DatabaseResponse<ShippingItem[]>
> {
	try {
		const coll = await getCollection("Items");
		const items = await coll.find({ deletedAt: null }).toArray();
		return {
			success: true,
			data: serializeDocuments(items as ShippingItem[]),
			status: 200,
			message: "Available items retrieved successfully",
		};
	} catch (error) {
		console.error("Error fetching available items:", error);
		return {
			success: false,
			error: "Failed to fetch available items",
			status: 500,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Add a new item to the database
 * @param item ShippingItem object to add (without _id)
 * @returns DatabaseResponse containing created item
 */
export async function addItemToDatabase(
	item: Omit<ShippingItem, "_id">
): Promise<DatabaseResponse<ShippingItem>> {
	return createDocument<ShippingItem>("Items", {
		...item,
		deletedAt: null,
	});
}

/**
 * Update an existing item in the database
 * @param item ShippingItem object with updates
 * @returns DatabaseResponse containing updated item
 */
export async function updateItemInDatabase(
	item: ShippingItem
): Promise<DatabaseResponse<ShippingItem>> {
	const { _id, ...updateData } = item;
	return updateDocument<ShippingItem>("Items", _id, updateData);
}

/**
 * Soft delete an item by setting deletedAt timestamp
 * @param id ObjectId of the item to delete
 * @returns DatabaseResponse containing deleted item
 */
export async function deleteItemFromDatabase(
	id: string | ObjectId
): Promise<DatabaseResponse<ShippingItem>> {
	return deleteDocument<ShippingItem>("Items", id);
}
