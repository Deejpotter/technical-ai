/**
 * MongoDB client management.
 * Updated: 30/03/25
 * Author: Deej Potter
 * Description: Provides a cached MongoDB client for server-side Next.js actions.
 * Should be used in other files instead of initializing a new mongoclient each time.
 */

import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
	throw new Error("Please add your Mongo URI to .env");
}

const uri = process.env.MONGODB_URI;

// Declare global variables for connection caching
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Creates a cached MongoDB client connection
 * This prevents multiple connections in development mode with hot reloading
 * @returns Promise<MongoClient>
 */
export function getClientPromise() {
	if (process.env.NODE_ENV === "development") {
		// In development, use a global variable to preserve connection across HMR
		if (!global._mongoClientPromise) {
			client = new MongoClient(uri);
			global._mongoClientPromise = client.connect();
		}
		return global._mongoClientPromise;
	}

	// In production, use a regular promise
	if (!clientPromise) {
		client = new MongoClient(uri);
		clientPromise = client.connect();
	}
	return clientPromise;
}

/**
 * Get a MongoDB collection with automatic connection handling
 * Uses connection pooling to prevent multiple connections
 * @param collectionName Name of the collection to access
 * @returns The requested MongoDB collection
 */
export async function getCollection(collectionName: string) {
	try {
		const clientPromise = getClientPromise();
		const client = await clientPromise;
		const db = client.db(process.env.MONGODB_DB || "CncTools");
		return db.collection(collectionName);
	} catch (error) {
		console.error("Database connection error:", error);
		throw error;
	}
}
