/**
 * MongoDB client management for Express backend.
 * Updated: 08/06/2025
 * Author: Deej Potter (Original from sample code), Adapted by AI
 * Description: Provides a cached MongoDB client.
 * Should be used in other files instead of initializing a new mongoclient each time.
 */

import { MongoClient } from "mongodb";

// Ensure MONGODB_URI is set in your environment variables
if (!process.env.MONGODB_URI) {
	throw new Error(
		"Please add your Mongo URI to .env (e.g., in a .env file and use dotenv)"
	);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "CncTools"; // Default DB name if not set

// Declare global variables for connection caching
// Using globalThis for broader compatibility in different Node.js module systems
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Creates or returns a cached MongoDB client connection promise.
 * This helps prevent multiple connections, especially during development with hot reloading.
 * @returns Promise<MongoClient>
 */
export function getClientPromise(): Promise<MongoClient> {
	if (process.env.NODE_ENV === "development") {
		// In development, use a global variable to preserve connection across HMR or similar features.
		// Make sure your global declaration is correctly typed if you have a global.d.ts
		if (!(globalThis as any)._mongoClientPromise) {
			client = new MongoClient(uri);
			(globalThis as any)._mongoClientPromise = client.connect();
		}
		return (globalThis as any)._mongoClientPromise;
	}

	// In production or other environments, manage the promise locally.
	if (!clientPromise) {
		client = new MongoClient(uri);
		clientPromise = client.connect();
	}
	return clientPromise;
}

/**
 * Get a MongoDB collection with automatic connection handling.
 * Uses the cached client promise to interact with the database.
 * @param collectionName Name of the collection to access.
 * @returns The requested MongoDB collection.
 * @throws Will throw an error if the database connection fails.
 */
export async function getCollection(collectionName: string) {
	console.log(
		`[MongoClient] getCollection called. collectionName: ${collectionName}`
	);
	try {
		const mongoClient = await getClientPromise();
		const db = mongoClient.db(dbName);
		return db.collection(collectionName);
	} catch (error) {
		console.error(
			`[MongoClient] Database connection or collection access error:`,
			error
		);
		// Propagate the error to be handled by the caller
		throw new Error(
			`Failed to get collection '${collectionName}': ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

/**
 * Optional: Function to explicitly close the MongoDB connection.
 * Useful for graceful shutdowns.
 */
export async function closeConnection(): Promise<void> {
	if (client) {
		await client.close();
		client = null;
		clientPromise = null;
		if (process.env.NODE_ENV === "development") {
			(globalThis as any)._mongoClientPromise = null;
		}
		console.log("MongoDB connection closed.");
	}
}
