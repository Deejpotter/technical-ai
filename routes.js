const express = require('express');
const router = express.Router();
const winston = require('winston');

// Import chat engine and QA manager (these will need to be converted to JS as well)
const { ChatEngine } = require('./chat_engine');
const { QAManager } = require('./qa_manager');

// Initialize logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: 'app.log' })
  ]
});

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
router.post('/ask', async (req, res) => {
  try {
    const { user_message } = req.body;
    const botResponse = await chatEngine.processUserInput(user_message);
    res.status(200).json({ bot_response: botResponse });
  } catch (error) {
    if (error instanceof TypeError || error.name === 'KeyError') {
      logger.error(`KeyError occurred: ${error.message}`);
      res.status(400).json({ error: `KeyError: ${error.message}` });
    } else if (error instanceof Error) {
      logger.error(`An unexpected error occurred: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
});

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
router.post('/add_qa', async (req, res) => {
  const { question = '', answer = '' } = req.body;
  const data = { question, answer };
  await dataManager.create(data);
  res.json({ status: 'success' });
});

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
router.get('/get_qa/:questionId', async (req, res) => {
  const qaPair = await dataManager.getQaPair(req.params.questionId);
  res.json(qaPair);
});

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
router.put('/update_qa/:questionId', async (req, res) => {
  const { question = '', answer = '' } = req.body;
  await dataManager.updateQaPair(req.params.questionId, question, answer);
  res.json({ status: 'success' });
});

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
router.delete('/delete_qa/:questionId', async (req, res) => {
  await dataManager.deleteQaPair(req.params.questionId);
  res.json({ status: 'success' });
});

module.exports = router;
