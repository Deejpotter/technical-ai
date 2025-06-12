/**
 * Main Express Application
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file initializes and configures the Express application, including middleware and route setup.
 */
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai";
import cncRoutes from "./routes/cnc";
import shippingRoutes from "./routes/shipping";
import userRoutes from "./routes/users"; // Import user routes
import { requireAuth } from "./middleware/clerkAuth";

const app = express();

// CORS configuration using ALLOWED_ORIGINS from .env
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	})
);
app.use(express.json());

// Example: Protect all /api/ai routes (customize as needed)
app.use("/api/ai", requireAuth, aiRoutes);

// Mount API routes
app.use("/api/cnc", cncRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/users", requireAuth, userRoutes); // Add user routes, protected by requireAuth

// Health check endpoint for deployment and monitoring
// Returns 200 OK if the server is running
app.get("/api/health", (req, res) => {
	/**
	 * Health Check Endpoint
	 * Returns 200 OK if the server is running.
	 * Useful for deployment platforms and uptime monitoring.
	 */
	res.status(200).json({ status: "ok", message: "API is healthy" });
});

// WhoAmI endpoint: returns the authenticated user's ID (and optionally more info)
app.get("/api/whoami", requireAuth, (req, res) => {
	// req.userId is set by Clerk middleware
	res.json({
		userId: (req as any).userId,
		// Optionally add more user info here if needed
	});
});

// 404 handler for unknown API routes
// This should be placed after all other route handlers
app.use((req, res, next) => {
	/**
	 * 404 Not Found Handler
	 * Catches all requests to unknown endpoints and returns a JSON error.
	 */
	res.status(404).json({
		error: "Not Found",
		message: `Route ${req.originalUrl} does not exist.`,
	});
});

// Centralized error handling middleware
// Catches errors thrown in routes and returns a consistent JSON response
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		/**
		 * Error Handling Middleware
		 * Logs the error and returns a JSON error response.
		 * Ensures the API never crashes due to unhandled errors.
		 */
		console.error("[API Error]", err);
		res.status(err.status || 500).json({
			error: err.name || "InternalServerError",
			message: err.message || "An unexpected error occurred.",
		});
	}
);

// Start the server on the specified port.
const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Express server listening on port ${port}`);
});

// Export app for testing purposes (Jest, Supertest, etc.)
export default app;
