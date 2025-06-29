import express from "express";
import { requireAuth, getAuth, clerkClient } from "@clerk/express";
import { requireMasterAdmin } from "../middleware/requireMasterAdmin";
import { AuthenticatedRequest } from "../types/express"; // Ensure this path is correct
import { wrapAsync } from "../utils/wrapAsync";

const router = express.Router();

if (!process.env.CLERK_SECRET_KEY) {
	console.error(
		"CLERK_SECRET_KEY is not defined in .env. User operations will fail."
	);
	// Optionally, you could throw an error here to prevent the app from starting
	// throw new Error("CLERK_SECRET_KEY is not defined. Please set it in your .env file.");
}

// Log all user management API requests
router.use((req, res, next) => {
	console.log(
		`[Users] ${req.method} ${req.originalUrl} by userId: ${
			(req as any).auth?.userId
		}`
	);
	next();
});

// Handlers remain as async functions returning Promise<void>
const updateUserRoleHandler = async (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
): Promise<void> => {
	/**
	 * Handler uses Express.Request for compatibility, but we cast to AuthenticatedRequest for Clerk fields.
	 */
	const authReq = req as AuthenticatedRequest;
	const { userIdToUpdate, isAdmin } = req.body;

	if (!userIdToUpdate || typeof isAdmin !== "boolean") {
		res.status(400).json({
			error:
				"Missing userIdToUpdate or isAdmin in request body, or isAdmin is not a boolean.",
		});
		return;
	}

	if (!process.env.CLERK_SECRET_KEY) {
		console.error("CLERK_SECRET_KEY is not set. Cannot update user metadata.");
		res.status(500).json({
			error: "Server configuration error: Clerk Secret Key not set.",
		});
		return;
	}

	try {
		// The user making the request is authenticated as Master Admin by the middleware
		// Now, update the target user's metadata
		const updatedUser = await clerkClient.users.updateUserMetadata(
			userIdToUpdate,
			{
				publicMetadata: {
					isAdmin: isAdmin,
				},
			}
		);

		res.status(200).json({
			message: "User role updated successfully.",
			user: updatedUser,
		});
		return;
	} catch (error: any) {
		console.error("Error updating user metadata:", error);
		let errorMessage = "Failed to update user role.";
		let statusCode = 500;

		if (error.status && error.errors && error.errors.length > 0) {
			statusCode = error.status;
			errorMessage = error.errors.map((e: any) => e.message).join(", ");
		} else if (error.message) {
			errorMessage = error.message;
		}

		res.status(statusCode).json({ error: errorMessage });
		return;
	}
};

const listUsersHandler = async (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
): Promise<void> => {
	/**
	 * Handler uses Express.Request for compatibility, but we cast to AuthenticatedRequest for Clerk fields.
	 */
	const authReq = req as AuthenticatedRequest;
	if (!process.env.CLERK_SECRET_KEY) {
		console.error("CLERK_SECRET_KEY is not set. Cannot list users.");
		res.status(500).json({
			error: "Server configuration error: Clerk Secret Key not set.",
		});
		return;
	}
	try {
		// Parameters for pagination, can be adjusted or made configurable via query params
		const limit = 50; // Clerk API default is 10, max is 500
		let offset = 0;
		if (req.query.offset && !isNaN(Number(req.query.offset))) {
			offset = Number(req.query.offset);
		}

		const userListResponse = await clerkClient.users.getUserList({
			limit,
			offset,
			orderBy: "+created_at",
		});
		const users = userListResponse.data || userListResponse;
		const totalCount = await clerkClient.users.getCount();

		// We might want to simplify the user object returned to the frontend
		const simplifiedUsers = users.map((user: any) => ({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			emailAddress: user.emailAddresses.find(
				(email: any) => email.id === user.primaryEmailAddressId
			)?.emailAddress,
			publicMetadata: user.publicMetadata,
			lastSignInAt: user.lastSignInAt,
			createdAt: user.createdAt,
		}));

		res.status(200).json({ users: simplifiedUsers, totalCount, limit, offset });
		return;
	} catch (error: any) {
		console.error("Error fetching user list:", error);
		let errorMessage = "Failed to fetch user list.";
		let statusCode = 500;

		if (error.status && error.errors && error.errors.length > 0) {
			statusCode = error.status;
			errorMessage = error.errors.map((e: any) => e.message).join(", ");
		} else if (error.message) {
			errorMessage = error.message;
		}
		res.status(statusCode).json({ error: errorMessage });
		return;
	}
};

// Use wrapAsync to ensure correct typing and error propagation
router.post(
	"/update-user-role",
	requireMasterAdmin,
	wrapAsync(updateUserRoleHandler)
);
router.get("/list-users", requireMasterAdmin, wrapAsync(listUsersHandler));

export default router;
