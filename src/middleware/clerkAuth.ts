import { Request, Response, NextFunction } from "express";
import { requireAuth, getAuth } from "@clerk/express";

/**
 * Interface extending Express Request to include user information
 * This allows TypeScript to recognize the user property on req
 */
export interface AuthenticatedRequest extends Request {
	userId?: string;
	user?: any; // You can create a more specific User interface
}

/**
 * Middleware to verify Clerk JWT tokens and authenticate requests
 * Extracts the token from Authorization header and verifies it with Clerk
 * Adds user information to the request object for downstream handlers
 */
export const requireAuthMiddleware = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Extract token from Authorization header
		// Expected format: "Bearer <jwt_token>"
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			res.status(401).json({
				error: "Authentication required",
				message: "No valid authorization header found",
			});
			return;
		}
		// Extract the JWT token (remove "Bearer " prefix)
		const token = authHeader.substring(7);
		try {
			// Verify the JWT token with Clerk
			// This will throw an error if the token is invalid or expired
			const { userId } = getAuth(req);
			if (!userId) {
				throw new Error("User not found");
			}
			// Add user ID to request object for use in route handlers
			req.userId = userId;
			// Optionally, fetch full user details from Clerk
			// const user = await clerkClient.users.getUser(payload.sub);
			// req.user = user;
			next();
		} catch (clerkError: any) {
			console.error("Clerk token verification failed:", clerkError);
			res.status(401).json({
				error: "Invalid token",
				message: "Token verification failed",
			});
			return;
		}
	} catch (error) {
		console.error("Authentication middleware error:", error);
		res.status(500).json({
			error: "Authentication error",
			message: "Internal server error during authentication",
		});
		return;
	}
};

/**
 * Optional: Middleware for routes that can work with or without authentication
 * Sets user information if token is present, but doesn't require it
 */
export const optionalAuth = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			try {
				const { userId } = getAuth(req);
				if (userId) {
					req.userId = userId;
				}
			} catch (clerkError: any) {
				// Token is invalid, but we continue without authentication
				console.warn("Optional auth - invalid token:", clerkError.message);
			}
		}
		next();
	} catch (error) {
		console.error("Optional authentication error:", error);
		next(); // Continue even if there's an error
	}
};

export { requireAuth, getAuth } from "@clerk/express";
