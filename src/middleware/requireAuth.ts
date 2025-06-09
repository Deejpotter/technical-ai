/**
 * Auth0 JWT Verification Middleware
 * Author: Deej Potter
 * Description: Express middleware to verify JWTs issued by Auth0. Protects API endpoints by ensuring only authenticated users can access them.
 *
 * Usage:
 *   - Add this middleware to any route that requires authentication.
 *   - Expects the JWT to be sent in the Authorization header as a Bearer token.
 *
 * Environment Variables:
 *   - AUTH0_DOMAIN: Your Auth0 domain (e.g., dev-abc123.us.auth0.com)
 *   - AUTH0_AUDIENCE: The API identifier set in Auth0
 *   - AUTH0_ISSUER: The issuer URL (e.g., https://dev-abc123.us.auth0.com/)
 *
 * Dependencies:
 *   - jose
 */
import { Request as ExpressRequest, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet, JWTVerifyResult } from "jose";

const issuer = process.env.AUTH0_ISSUER;
const audience = process.env.AUTH0_AUDIENCE;
const jwksUri = `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`;

if (!issuer || !audience || !process.env.AUTH0_DOMAIN) {
	throw new Error(
		"AUTH0_ISSUER, AUTH0_AUDIENCE, or AUTH0_DOMAIN is not set in environment variables."
	);
}

const JWKS = createRemoteJWKSet(new URL(jwksUri));

interface AuthenticatedRequest extends ExpressRequest {
	user?: any;
}

export async function requireAuth(
	req: ExpressRequest,
	res: Response,
	next: NextFunction
) {
	const authHeader = req.headers["authorization"];
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		res.status(401).json({
			error: "Unauthorized",
			message: "Missing or invalid Authorization header.",
		});
		return;
	}
	const token = authHeader.replace("Bearer ", "");
	try {
		const { payload } = await jwtVerify(token, JWKS, {
			issuer,
			audience,
		});
		(req as AuthenticatedRequest).user = payload;
		next();
	} catch (err: any) {
		res.status(401).json({
			error: "Unauthorized",
			message: err.message || "Invalid or expired token.",
		});
	}
}
