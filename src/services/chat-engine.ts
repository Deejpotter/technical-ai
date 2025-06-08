/**
 * Chat Engine Service
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file provides the ChatEngine class, responsible for handling chat interactions, context management, and AI model communication.
 */

import OpenAI from "openai";
import { ChatMessage } from "../types/chat";
import { DataProvider } from "../data/DataProvider";
import { MongoDBProvider } from "../data/MongoDBProvider"; // Corrected import path
import { logger } from "../utils/logger"; // Corrected import path

export class ChatEngine {
	private openai: OpenAI;
	private dataProvider: DataProvider;
	private readonly collectionName = "chat_history";

	constructor() {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
		this.dataProvider = new MongoDBProvider();
	}

	/**
	 * Process user input and get a response from the AI model.
	 * @param userInput The user's message.
	 * @returns The AI's response.
	 */
	async processUserInput(userInput: string): Promise<string> {
		try {
			// 1. Store user message
			const userMessage: ChatMessage = {
				role: "user",
				content: userInput,
				timestamp: new Date(),
			};
			await this.dataProvider.createDocument<ChatMessage>(
				this.collectionName,
				userMessage
			);

			// 2. Fetch chat history
			const historyResponse =
				await this.dataProvider.getAllDocuments<ChatMessage>(
					this.collectionName
				);
			let history: ChatMessage[] = [];
			if (historyResponse.success && historyResponse.data) {
				history = historyResponse.data;
			}

			// 3. Prepare messages for OpenAI API
			const messages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map(
				(msg) => ({
					role: msg.role,
					content: msg.content,
				})
			);
			// Add current user input to the messages array
			messages.push({ role: "user", content: userInput });

			// 4. Get AI response
			const completion = await this.openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				messages: messages,
			});

			const botResponseContent = completion.choices[0]?.message?.content;

			if (!botResponseContent) {
				logger.error("OpenAI response content is null or undefined.");
				throw new Error("Failed to get a valid response from the AI model.");
			}

			// 5. Store AI response
			const botMessage: ChatMessage = {
				role: "assistant",
				content: botResponseContent,
				timestamp: new Date(),
			};
			await this.dataProvider.createDocument<ChatMessage>(
				this.collectionName,
				botMessage
			);

			return botResponseContent;
		} catch (error: any) {
			logger.error("Error processing user input in ChatEngine:", error);
			throw new Error(`ChatEngine processing failed: ${error.message}`);
		}
	}

	/**
	 * Retrieves the full chat history.
	 * @returns A promise that resolves to an array of chat messages.
	 */
	async getChatHistory(): Promise<ChatMessage[]> {
		try {
			const response = await this.dataProvider.getAllDocuments<ChatMessage>(
				this.collectionName
			);
			if (response.success && response.data) {
				return response.data;
			}
			logger.warn("No chat history found or failed to retrieve.");
			return [];
		} catch (error: any) {
			logger.error("Error retrieving chat history:", error);
			return []; // Return empty array on error
		}
	}

	/**
	 * Clears the chat history.
	 * This is a destructive operation and should be used with caution.
	 * For simplicity, this example deletes all documents. In a real app,
	 * you might soft-delete or archive based on conversation IDs.
	 */
	async clearChatHistory(): Promise<void> {
		try {
			// Fetch all document IDs to delete them one by one if no "deleteMany" is available
			// Or, if your DataProvider supported a deleteMany or clearCollection, that would be more efficient.
			const historyResponse =
				await this.dataProvider.getAllDocuments<ChatMessage>(
					this.collectionName
				);
			if (historyResponse.success && historyResponse.data) {
				for (const message of historyResponse.data) {
					if (message._id) {
						// Ensure _id exists
						await this.dataProvider.deleteDocument(
							this.collectionName,
							message._id.toString()
						);
					}
				}
			}
			logger.info("Chat history cleared.");
		} catch (error: any) {
			logger.error("Error clearing chat history:", error);
		}
	}
}
