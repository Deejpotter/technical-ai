// filepath: c:/Users/Deej/Repos/technical-ai/src/utils/chatStream.ts
/**
 * chatStream
 * Updated: 08/07/2025
 * Author: Deej Potter
 * Description: Stream handling utility for OpenAI chat completions API.
 * Simplified implementation for development purposes.
 * TODO: Implement proper streaming functionality in a future update.
 */

import endent from "endent";
import { Readable } from "stream";

/**
 * Creates a formatted prompt from input code
 * @param inputCode - The code to format
 * @returns Formatted prompt string
 */
const createPrompt = (inputCode: string): string => {
	if (!inputCode) return "";

	return endent`${inputCode}`;
};

/**
 * Temporary implementation of OpenAIStream that doesn't use streaming
 * This is a placeholder until we implement proper streaming functionality
 */
export const OpenAIStream = async (
	inputCode: string,
	model: string,
	key: string | undefined
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ReadableStream<any>> => {
	const prompt = createPrompt(inputCode);
	const system = { role: "system", content: prompt };

	try {
		// Non-streaming request for now
		const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${key || process.env.OPENAI_API_KEY}`, // Ensure OPENAI_API_KEY is used from .env
			},
			method: "POST",
			body: JSON.stringify({
				model,
				messages: [system],
				temperature: 0,
				stream: false, // Changed to false to avoid streaming
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`OpenAI API returned an error: ${response.status} ${response.statusText}`,
				errorText
			);
			throw new Error(
				`OpenAI API returned an error: ${response.status} ${response.statusText}`
			);
		}

		const result = await response.json();
		const text = result.choices[0].message.content || "";

		// Create a simple stream with the complete response
		const encoder = new TextEncoder();
		const encoded = encoder.encode(text);

		// Return a ReadableStream that immediately provides the entire response
		return new ReadableStream({
			start(controller) {
				controller.enqueue(encoded);
				controller.close();
			},
		});
	} catch (error) {
		console.error("Error in OpenAI API call:", error);
		throw error;
	}
};
