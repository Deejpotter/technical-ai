/**
 * MongoDB Connection Utility
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file will contain utility functions for connecting to and interacting with MongoDB.
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

if (!process.env.MONGODB_URI) {
	throw new Error("Please add your Mongo URI to .env (MONGODB_URI)");
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "CncTools"; // Default DB name if not specified

// Declare global variable for connection caching to avoid re-creating connections during development hot-reloads.
// In a production environment, this pattern might be different depending on the deployment strategy.
// For serverless functions, connection management is often handled per invocation or with specific pooling mechanisms.
declare global {
	// eslint-disable-next-line no-var
	var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
	// In development mode, use a global variable so that the value
	// is preserved across module reloads caused by HMR (Hot Module Replacement).
	if (!global._mongoClientPromise) {
		client = new MongoClient(uri);
		global._mongoClientPromise = client.connect();
	}
	clientPromise = global._mongoClientPromise;
} else {
	// In production mode, it's best to not use a global variable.
	client = new MongoClient(uri);
	clientPromise = client.connect();
}

/**
 * Returns a promise that resolves to the MongoDB client.
 * This function ensures that the client is connected before being used.
 * @returns {Promise<MongoClient>} A promise that resolves to the connected MongoClient.
 */
export async function getClient(): Promise<MongoClient> {
	return clientPromise;
}

/**
 * Get a MongoDB collection with automatic connection handling.
 * This is a convenience function to quickly get a collection object.
 * @param {string} collectionName - Name of the collection to access.
 * @returns {Promise<import("mongodb").Collection>} The requested MongoDB collection.
 * @throws Will throw an error if the database connection fails.
 */
export async function getCollection(collectionName: string) {
	try {
		const connectedClient = await getClient();
		const db = connectedClient.db(dbName);
		return db.collection(collectionName);
	} catch (error) {
		console.error("Database connection or collection retrieval error:", error);
		// Depending on error handling strategy, you might re-throw or handle differently
		throw new Error(`Failed to get collection: ${collectionName}`);
	}
}

// Export the promise directly for modules that prefer to await it.
export default clientPromise;
