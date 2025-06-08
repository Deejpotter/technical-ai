/**
 * Chat Service Types
 * Updated: 08/07/2025
 * Author: Deej Potter
 * Description: This file defines TypeScript interfaces and types for chat messages, responses, and related entities.
 */

import { MongoDocument } from "./mongodb";

/**
 * ChatResponse interface for bot responses
 */
export interface ChatResponse {
	bot_response: string;
}

/**
 * QAPair interface for question-answer data
 */
export interface QAPair extends MongoDocument {
	question: string;
	answer: string;
}

/**
 * ChatMessage interface for chat history
 */
export interface ChatMessage extends MongoDocument {
	role: "user" | "assistant" | "system"; // Added role field
	content: string; // Standardized content field
	timestamp: Date;
	// user_message and bot_response can be deprecated or mapped to content based on role
	user_message?: string; // Optional, for backward compatibility or specific use cases
	bot_response?: string; // Optional
}

/**
 * Defines the expected structure for the chat request body.
 */
export interface ChatBody {
	inputCode: string;
	model: string; // Specify the model to be used, e.g., "gpt-3.5-turbo"
	apiKey?: string; // Optional API key, if not using environment variable
}
