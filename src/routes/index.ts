/**
 * Index Router for API
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file serves as the main router, aggregating all other specific route modules for the API.
 */

/**
 * API Routes
 * Updated: 25/05/25
 * Author: Deej Potter
 * Description: Express routes for the CNC Technical Support Chatbot API
 */

import express, { Request, Response } from "express";
import { ChatEngine } from "../services/chat-engine";
import { QAManager } from "../services/qa-manager";
import { ChatResponse, QAPair } from "../types/chat";

const router = express.Router();

// Initialize data manager and chat engine
const dataManager = new QAManager();
const chatEngine = new ChatEngine();

/**
 * @swagger
 * /ask:
 *   post:
 *     description: Ask a question to the chatbot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_message
 *             properties:
 *               user_message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns the bot's response
 */
router.post(
	"/ask",
	async (
		req: Request<any, any, { user_message: string }>,
		res: Response<ChatResponse>
	) => {
		try {
			const userMessage = req.body.user_message;
			const botResponse = await chatEngine.processUserInput(userMessage);
			res.json({ bot_response: botResponse });
		} catch (error: any) {
			if (error instanceof TypeError || error.name === "KeyError") {
				// logger.error(`KeyError or TypeError occurred: ${error.message}`);
				console.error(`KeyError or TypeError occurred: ${error.message}`);
				res.status(500).json({
					bot_response: "", // Added to satisfy ChatResponse type
					error: "An error occurred while processing your request.",
				});
			} else if (error instanceof Error) {
				// logger.error(`An unexpected error occurred: ${error.message}`);
				console.error(`An unexpected error occurred: ${error.message}`);
				res.status(500).json({
					bot_response: "", // Added to satisfy ChatResponse type
					error: "An unexpected error occurred.",
				});
			} else {
				// logger.error("An unexpected non-error object was thrown:", error);
				console.error("An unexpected non-error object was thrown:", error);
				res.status(500).json({
					bot_response: "", // Added to satisfy ChatResponse type
					error: "An unexpected error occurred.",
				});
			}
		}
	}
);

/**
 * @swagger
 * /add_qa:
 *   post:
 *     description: Add a new question-answer pair
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success status
 */
router.post(
	"/add_qa",
	async (req: Request<any, any, Partial<QAPair>>, res: Response) => {
		const { question = "", answer = "" } = req.body;
		const data = { question, answer };
		await dataManager.create(data);
		res.json({ status: "success" });
	}
);

/**
 * @swagger
 * /get_qa/{questionId}:
 *   get:
 *     description: Get a question-answer pair by ID
 *     parameters:
 *       - name: questionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the question-answer pair
 */
router.get(
	"/get_qa/:questionId",
	async (req: Request<{ questionId: string }>, res: Response) => {
		const qaPair = await dataManager.getQaPair(req.params.questionId);
		res.json(qaPair);
	}
);

/**
 * @swagger
 * /update_qa/{questionId}:
 *   put:
 *     description: Update a question-answer pair by ID
 *     parameters:
 *       - name: questionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success status
 */
router.put(
	"/update_qa/:questionId",
	async (
		req: Request<{ questionId: string }, any, Partial<QAPair>>,
		res: Response
	) => {
		const { question = "", answer = "" } = req.body;
		await dataManager.updateQaPair(req.params.questionId, question, answer);
		res.json({ status: "success" });
	}
);

/**
 * @swagger
 * /delete_qa/{questionId}:
 *   delete:
 *     description: Delete a question-answer pair by ID
 *     parameters:
 *       - name: questionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success status
 */
router.delete(
	"/delete_qa/:questionId",
	async (req: Request<{ questionId: string }>, res: Response) => {
		await dataManager.deleteQaPair(req.params.questionId);
		res.json({ status: "success" });
	}
);

export { router };
