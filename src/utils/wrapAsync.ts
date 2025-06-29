// Utility to wrap async route handlers and ensure proper error propagation and typing
// Usage: router.get('/route', wrapAsync(async (req, res) => { ... }))
//
// This function is used throughout the backend to avoid repetitive try/catch blocks in async Express route handlers.
// If an error is thrown or a rejected promise is returned, Express will catch it via next(err),
// so you get consistent error handling and logging via your error middleware.
//
// Example:
//   router.get('/api/some-route', wrapAsync(async (req, res) => { ... }));
//
// This is my preferred pattern for all async routes, as it keeps the codebase clean and avoids subtle bugs
// where errors might otherwise be swallowed or not logged properly.

import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 *
 * @param fn The async function to wrap. It should accept (req, res, next) parameters.
 *           This function should return a Promise.
 * @returns Promise-based Express middleware that catches errors and passes them to next().
 */
export function wrapAsync(
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
	// Return a standard Express middleware function
	return function (req, res, next) {
		// Always resolve the promise and pass any errors to next()
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
