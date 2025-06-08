/**
 * Chat and QA Types
 * Updated: 25/05/25
 * Author: Deej Potter
 * Description: Types for chat and QA management functionality
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
	user_message: string;
	bot_response: string;
	timestamp: Date;
}
