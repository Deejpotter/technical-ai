// Utility to wrap async route handlers and ensure proper error propagation and typing
// Usage: router.get('/route', wrapAsync(async (req, res) => { ... }))
import { Request, Response, NextFunction, RequestHandler } from "express";

export function wrapAsync(
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
	return function (req, res, next) {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
