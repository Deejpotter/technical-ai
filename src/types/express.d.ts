// TypeScript declaration merging for Express Request to include user property
import { JwtPayload } from "jsonwebtoken";
import type { AuthObject } from "@clerk/express";

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
			auth?: {
				// Add auth property for Clerk
				userId: string | null | undefined;
				sessionId: string | null | undefined;
				sessionClaims: AuthObject | null | undefined;
				actor: any | null | undefined;
				orgId: string | null | undefined;
				orgRole: string | null | undefined;
				orgSlug: string | null | undefined;
				orgPermissions: string[] | null | undefined;
			};
		}
	}
}

// Add AuthenticatedRequest type
export interface AuthenticatedRequest extends Express.Request {
	auth: {
		userId: string;
		sessionClaims: AuthObject & {
			publicMetadata?: { isMaster?: boolean; isAdmin?: boolean };
		};
		// Add other properties from Clerk.dev.User if needed
	};
}

export {};
