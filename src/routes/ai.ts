/**
 * AI API Routes
 * Updated: 08/07/2025
 * Author: GitHub Copilot
 * Description: This file defines the Express routes for AI-related functionalities, such as chat.
 */

import {
	Router,
	Request,
	Response,
	NextFunction,
	RequestHandler,
} from "express"; // Added RequestHandler
import { AIService } from "../services/aiService"; // Changed from @/services/aiService
import { ChatBody } from "../types/chat"; // Changed from @/types/chat

const router = Router();
const aiService = new AIService();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatBody:
 *       type: object
 *       required:
 *         - inputCode
 *         - model
 *       properties:
 *         inputCode:
 *           type: string
 *           description: The input text or code for the AI.
 *         model:
 *           type: string
 *           description: The AI model to use (e.g., gpt-3.5-turbo).
 *         apiKey:
 *           type: string
 *           description: Optional OpenAI API key.
 * /api/ai/chat:
 *   post:
 *     summary: Handles chat requests with the AI.
 *     description: Receives a chat message, processes it using the AI service, and streams the response.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatBody'
 *     responses:
 *       200:
 *         description: A stream of AI-generated text.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request, e.g., missing or invalid parameters.
 *       500:
 *         description: Internal server error.
 */
const handleChatRequest: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	console.log(`[AI] /chat called. Body:`, req.body);
	try {
		const chatBody: ChatBody = req.body;

		if (!chatBody.inputCode || !chatBody.model) {
			res
				.status(400)
				.json({ error: "Missing inputCode or model in request body." });
			return; // Important to return after sending response
		}

		// Assuming aiService.handleChat returns Promise<ReadableStream<Uint8Array>>
		// which is a WHATWG ReadableStream.
		const stream: ReadableStream<Uint8Array> = await aiService.handleChat(
			chatBody
		);

		res.setHeader("Content-Type", "text/plain; charset=utf-8");

		// Pipe WHATWG ReadableStream to Express response
		try {
			for await (const chunk of stream) {
				if (!res.write(chunk)) {
					// Handle backpressure if necessary
					// await new Promise(resolve => res.once('drain', resolve)); // Example backpressure handling
				}
			}
			res.end();
			console.log(`[AI] /chat streaming response complete.`);
		} catch (streamError) {
			if (!res.headersSent) {
				// Let the main error handler deal with it by re-throwing or passing to next
				// If this specific error should be handled differently, adjust here.
				throw streamError;
			} else {
				// Headers sent, client might get a truncated response. Log and attempt to end.
				if (!res.writableEnded) {
					res.end();
				}
			}
		}
	} catch (error) {
		console.error(`[AI] /chat error:`, error);
		next(error); // Pass error to the Express error handler
	}
};

router.post("/chat", handleChatRequest);

export default router;
