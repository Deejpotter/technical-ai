// filepath: c:/Users/Deej/Repos/technical-ai/src/services/aiService.ts
/**
 * AI Service
 * Updated: 08/07/2025
 * Author: GitHub Copilot
 * Description: Handles AI-related logic, such as chat interactions with OpenAI.
 */

import { ChatBody } from "../types/chat"; // Changed from @/types/chat

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
			// logger.error( // Removed logger usage
			// 	"OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable or provide an apiKey in the request."
			// );
			console.error(
				"OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable or provide an apiKey in the request."
			); // Replaced logger with console.error
			throw new Error("OpenAI API key is not configured.");
		}

		try {
			// const stream = await OpenAIStream(inputCode, model, apiKeyFinal); // Removed OpenAIStream usage
			// return stream;
			// Placeholder for actual OpenAI call since OpenAIStream was removed
			const response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKeyFinal}`,
					},
					body: JSON.stringify({
						model: model,
						messages: [{ role: "user", content: inputCode }],
						stream: true,
					}),
				}
			);
			if (!response.ok) {
				const errorBody = await response.text();
				console.error(
					`OpenAI API error: ${response.status} ${response.statusText}`,
					errorBody
				);
				throw new Error(
					`Failed to fetch from OpenAI: ${response.status} ${response.statusText}`
				);
			}
			return response.body as ReadableStream<Uint8Array>; // Return the stream from the response
		} catch (error) {
			// logger.error("Error in AI service handling chat:", error); // Removed logger usage
			console.error("Error in AI service handling chat:", error); // Replaced logger with console.error
			// Ensure a generic error is thrown to avoid leaking sensitive details
			throw new Error(
				"Failed to process chat request due to an internal error."
			);
		}
	}
}
