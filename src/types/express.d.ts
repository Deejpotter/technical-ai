// TypeScript declaration merging for Express Request to include user property
import { JwtPayload } from "jsonwebtoken";

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}

export {};
