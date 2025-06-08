/**
 * QA Manager Service
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file contains the QAManager class, responsible for managing and retrieving question-answer pairs from the data source.
 */

import { DataProvider } from "../data/DataProvider";
import { MongoDBProvider } from "../data/MongoDBProvider";
import { DatabaseResponse } from "../types/mongodb"; // Added import for DatabaseResponse
import { QAPair } from "../types/chat";

export class QAManager {
	private dataProvider: DataProvider; // Use interface type
	private readonly collectionName = "qa_pairs";

	constructor() {
		this.dataProvider = new MongoDBProvider();
	}

	/**
	 * Create a new QA pair
	 */
	async create(data: Partial<QAPair>): Promise<DatabaseResponse<QAPair>> {
		return this.dataProvider.createDocument<QAPair>(
			this.collectionName,
			data as Omit<QAPair, "_id">
		);
	}

	/**
	 * Get a QA pair by ID
	 */
	async getQaPair(id: string): Promise<DatabaseResponse<QAPair>> {
		const response = await this.dataProvider.getDocuments<QAPair>(
			this.collectionName,
			{ _id: id }
		);
		if (response.success && response.data && response.data.length > 0) {
			return {
				...response,
				data: response.data[0],
			};
		}
		return {
			success: false,
			error: "QA pair not found",
			status: 404,
			message: "No QA pair found with the specified ID",
		};
	}

	/**
	 * Update a QA pair
	 */
	async updateQaPair(
		id: string,
		question: string,
		answer: string
	): Promise<DatabaseResponse<QAPair>> {
		return this.dataProvider.updateDocument<QAPair>(this.collectionName, id, {
			question,
			answer,
		});
	}

	/**
	 * Delete a QA pair
	 */
	async deleteQaPair(id: string): Promise<DatabaseResponse<QAPair>> {
		return this.dataProvider.deleteDocument<QAPair>(this.collectionName, id);
	}

	/**
	 * Get all QA pairs
	 */
	async getAllQaPairs(): Promise<DatabaseResponse<QAPair[]>> {
		return this.dataProvider.getAllDocuments<QAPair>(this.collectionName);
	}

	/**
	 * Search QA pairs by question
	 */
	async searchQaPairs(query: string): Promise<DatabaseResponse<QAPair[]>> {
		return this.dataProvider.getDocuments<QAPair>(this.collectionName, {
			question: { $regex: query, $options: "i" },
		});
	}
}
