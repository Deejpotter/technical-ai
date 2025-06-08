// filepath: c:/Users/Deej/Repos/technical-ai/src/services/aiService.ts
/**
 * AI Service
 * Updated: 08/07/2025
 * Author: GitHub Copilot
 * Description: Handles AI-related logic, such as chat interactions with OpenAI.
 */

import { OpenAIStream } from "@/utils/chatStream";
import { ChatBody } from "@/types/chat";
import { logger } from "@/utils/logger";

export class AIService {
	/**
	 * Handles a chat request by sending it to the OpenAI API and returning a stream.
	 * @param chatBody - The chat request body containing the input code, model, and optional API key.
	 * @returns A Promise that resolves to a ReadableStream with the AI's response.
	 */
	async handleChat(chatBody: ChatBody): Promise<ReadableStream<Uint8Array>> {
		const { inputCode, model, apiKey } = chatBody;

		let apiKeyFinal = apiKey;
		if (!apiKeyFinal) {
			apiKeyFinal = process.env.OPENAI_API_KEY;
		}

		if (!apiKeyFinal) {
			logger.error(
				"OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable or provide an apiKey in the request."
			);
			throw new Error("OpenAI API key is not configured.");
		}

		try {
			const stream = await OpenAIStream(inputCode, model, apiKeyFinal);
			return stream;
		} catch (error) {
			logger.error("Error in AI service handling chat:", error);
			// Ensure a generic error is thrown to avoid leaking sensitive details
			throw new Error(
				"Failed to process chat request due to an internal error."
			);
		}
	}
}
