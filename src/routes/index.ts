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
import { logger } from "../utils/logger"; // Corrected import path
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
			const { user_message } = req.body;
			const botResponse = await chatEngine.processUserInput(user_message);
			res.status(200).json({ bot_response: botResponse });
		} catch (error) {
			// Check if error is an instance of Error to safely access its properties
			if (error instanceof Error) {
				// Further check for specific error names if needed, though TypeError is an Error instance
				if (error.name === "KeyError" || error instanceof TypeError) {
					logger.error(`KeyError or TypeError occurred: ${error.message}`);
					res.status(400).json({ bot_response: `Error: ${error.message}` });
				} else {
					logger.error(`An unexpected error occurred: ${error.message}`);
					res.status(500).json({ bot_response: `Error: ${error.message}` });
				}
			} else {
				// Handle cases where the error is not an Error instance
				logger.error("An unexpected non-error object was thrown:", error);
				res.status(500).json({ bot_response: "An unexpected error occurred." });
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
