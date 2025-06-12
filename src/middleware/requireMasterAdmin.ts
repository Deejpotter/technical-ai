import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express";

export const requireMasterAdmin: import("express").RequestHandler = (
	req,
	res,
	next
) => {
	// Cast to AuthenticatedRequest to access Clerk fields
	const authReq = req as AuthenticatedRequest;
	const { auth } = authReq;

	if (!auth || !auth.sessionClaims) {
		res
			.status(401)
			.json({ error: "Unauthorized. Authentication details missing." });
		return;
	}

	const publicMetadata = auth.sessionClaims.publicMetadata || {};
	const isMaster = publicMetadata.isMaster === true;

	if (isMaster) {
		next();
	} else {
		res.status(403).json({
			error:
				"Forbidden. Master admin privileges required. Ensure 'isMaster' metadata is set in Clerk.",
		});
		return;
	}
};
