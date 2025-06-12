import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express"; // Ensure this type is correctly defined

export const requireMasterAdmin = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	const { auth } = req;

	if (!auth || !auth.sessionClaims) {
		// userId check removed as primary reliance is on isMaster metadata
		return res
			.status(401)
			.json({ error: "Unauthorized. Authentication details missing." });
	}

	// Check if publicMetadata exists on sessionClaims
	const publicMetadata = auth.sessionClaims.publicMetadata || {};

	const isMaster = publicMetadata.isMaster === true;

	// Removed the check against process.env.MASTER_ADMIN_USER_ID
	// Authorization now solely relies on the 'isMaster' flag in Clerk public metadata.
	if (isMaster) {
		next();
	} else {
		return res
			.status(403)
			.json({
				error:
					"Forbidden. Master admin privileges required. Ensure 'isMaster' metadata is set in Clerk.",
			});
	}
};
