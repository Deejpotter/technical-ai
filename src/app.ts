/**
 * CNC Technical Support Chatbot API
 * Updated: 25/05/25
 * Author: Deej Potter
 * Description: Main application entry point
 */

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import rateLimit from "express-rate-limit";
import winston from "winston";
import dotenv from "dotenv";
import path from "path";
import { router } from "./routes";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Read allowed origins from environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(",")
	: [];

// Enable CORS
app.use(
	cors({
		origin: allowedOrigins,
	})
);

// Initialize rate limiter
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Configure logging to log into app.log file with debug level
const logger = winston.createLogger({
	level: "debug",
	format: winston.format.simple(),
	transports: [new winston.transports.File({ filename: "app.log" })],
});

// Swagger configuration
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "CNC Technical Support Chatbot API",
			version: "1.0.0",
			description: "API for CNC Technical Support Chatbot",
		},
	},
	apis: ["./src/routes.ts"], // Updated path for TypeScript files
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve Swagger UI at /swagger endpoint
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Use routes
app.use("/", router);

// Redirect root to Swagger UI
app.get("/", (req, res) => {
	res.redirect("/swagger");
});

// Route to serve Swagger specification
app.get("/spec", (req, res) => {
	res.json(swaggerDocs);
});

// Define port
const PORT = process.env.PORT || 3000;

// Start the server
if (require.main === module) {
	app.listen(PORT, () => {
		logger.info(`Server is running in ${app.get("env")} mode on port ${PORT}`);
	});
}

export { app, logger };
