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
import invoiceRoutes from "./routes/invoiceRoutes";
import { requireAuth } from "./middleware/clerkAuth";

const app = express();

// --- Logging Middleware ---
// Log all incoming requests with method, path, and body (for POST/PUT)
app.use((req, res, next) => {
	console.log(`[Request] ${req.method} ${req.originalUrl}`);
	if (req.method === "POST" || req.method === "PUT") {
		console.log(`[Request Body]`, req.body);
	}
	// Attach a timestamp for later use
	req._requestTime = Date.now();
	next();
});

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
app.use("/api/ai", requireAuth(), aiRoutes);

// Mount API routes
app.use("/api/cnc", cncRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/users", requireAuth(), userRoutes); // Add user routes, protected by requireAuth
app.use("/api/invoice", requireAuth(), invoiceRoutes);

// Health check endpoint for deployment and monitoring
// Returns 200 OK if the server is running
app.get("/api/health", (req, res) => {
	console.log(`[HealthCheck] /api/health called`);
	res.status(200).json({ status: "ok", message: "API is healthy" });
});

// WhoAmI endpoint: returns the authenticated user's ID (and optionally more info)
app.get("/api/whoami", requireAuth(), (req, res) => {
	console.log(`[WhoAmI] /api/whoami called by userId: ${(req as any).userId}`);
	res.json({
		userId: (req as any).userId,
		// Optionally add more user info here if needed
	});
});

// 404 handler for unknown API routes
// This should be placed after all other route handlers
app.use((req, res, next) => {
	console.warn(`[404] Not Found: ${req.method} ${req.originalUrl}`);
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
		console.error("[API Error]", {
			message: err.message,
			stack: err.stack,
			status: err.status,
			method: req.method,
			url: req.originalUrl,
			requestBody: req.body,
			requestTime: req._requestTime,
		});
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

// Add a type declaration for _requestTime to avoid TS2339 errors
/**
 * Extend Express.Request to include _requestTime for logging.
 */
declare global {
	namespace Express {
		interface Request {
			_requestTime?: number;
		}
	}
}
