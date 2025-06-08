/**
 * Chat Engine Service
 * Updated: 25/05/25
 * Author: Deej Potter
 * Description: Handles chat interactions and responses using AI
 */

import { Configuration, OpenAIApi } from "openai";
import { ChatMessage } from "../types/chat";
import { MongoDBProvider } from "../data/MongoDBProvider";
import { logger } from "../app";

export class ChatEngine {
	private openai: OpenAIApi;
	private dataProvider: MongoDBProvider;
	private readonly collectionName = "chat_history";

	constructor() {
		const configuration = new Configuration({
			apiKey: process.env.OPENAI_API_KEY,
		});
		this.openai = new OpenAIApi(configuration);
		this.dataProvider = new MongoDBProvider();
	}

	/**
	 * Process user input and generate a response
	 */
	async processUserInput(userMessage: string): Promise<string> {
		try {
			const completion = await this.openai.createChatCompletion({
				model: process.env.GPT_MODEL || "gpt-3.5-turbo",
				messages: [
					{
						role: "system",
						content:
							"You are a helpful CNC machine technical support assistant. Answer questions about CNC machines, their operation, maintenance, and troubleshooting.",
					},
					{
						role: "user",
						content: userMessage,
					},
				],
			});

			const botResponse =
				completion.data.choices[0]?.message?.content ||
				"Sorry, I could not generate a response.";

			// Store the conversation in chat history
			await this.storeConversation(userMessage, botResponse);

			return botResponse;
		} catch (error) {
			logger.error("Error processing user input:", error);
			throw error;
		}
	}

	/**
	 * Store conversation in chat history
	 */
	private async storeConversation(
		userMessage: string,
		botResponse: string
	): Promise<void> {
		try {
			const chatMessage: Omit<ChatMessage, "_id"> = {
				user_message: userMessage,
				bot_response: botResponse,
				timestamp: new Date(),
			};

			await this.dataProvider.createDocument(this.collectionName, chatMessage);
		} catch (error) {
			logger.error("Error storing conversation:", error);
			// Don't throw the error as this is not critical for the chat functionality
		}
	}

	/**
	 * Get chat history
	 */
	async getChatHistory(): Promise<ChatMessage[]> {
		const response = await this.dataProvider.getAllDocuments<ChatMessage>(
			this.collectionName
		);
		return response.success ? response.data || [] : [];
	}

	/**
	 * Clear chat history
	 */
	async clearChatHistory(): Promise<void> {
		// This is a simplified version. In production, you might want to archive instead of delete
		// or implement a soft delete mechanism
		const history = await this.getChatHistory();
		for (const message of history) {
			if (message._id) {
				await this.dataProvider.deleteDocument(
					this.collectionName,
					message._id.toString()
				);
			}
		}
	}
}
