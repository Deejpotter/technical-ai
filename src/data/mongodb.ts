/**
 * MongoDB Client
 * Updated: 25/05/25
 * Author: Deej Potter
 * Description: Manages MongoDB client connection and provides access to collections
 */

import { Collection, Db, MongoClient } from "mongodb";

// MongoDB URI from environment variable
const uri = process.env.MONGODB_URI;
if (!uri) {
	throw new Error("Please add your MongoDB URI to .env");
}

// MongoDB client instance
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

/**
 * Get or create MongoDB client promise
 */
export function getClientPromise() {
	if (!clientPromise) {
		client = new MongoClient(uri!);
		clientPromise = client.connect();
	}
	return clientPromise;
}

/**
 * Get MongoDB collection
 */
export async function getCollection(collection: string): Promise<Collection> {
	const client = await getClientPromise();
	const db = client.db();
	return db.collection(collection);
}

/**
 * Get MongoDB database instance
 */
export async function getDb(): Promise<Db> {
	const client = await getClientPromise();
	return client.db();
}

/**
 * Close MongoDB connection
 */
export async function closeConnection() {
	if (client) {
		await client.close();
	}
}
