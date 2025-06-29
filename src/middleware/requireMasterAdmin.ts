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
	console.log(
		`[MasterAdmin] Checking master admin for userId: ${auth?.userId}, publicMetadata:`,
		auth?.sessionClaims?.publicMetadata
	);

	if (!auth || !auth.sessionClaims) {
		res
			.status(401)
			.json({ error: "Unauthorized. Authentication details missing." });
		return;
	}

	const publicMetadata = auth.sessionClaims.publicMetadata || {};
	const isMaster = publicMetadata.isMaster === true;

	if (isMaster) {
		console.log(
			`[MasterAdmin] Access granted to master admin userId: ${auth.userId}`
		);
		next();
	} else {
		console.warn(`[MasterAdmin] Access denied for userId: ${auth.userId}`);
		res.status(403).json({
			error:
				"Forbidden. Master admin privileges required. Ensure 'isMaster' metadata is set in Clerk.",
		});
		return;
	}
};
