import express from 'express';
import { clerkClient, RequireAuthProp } from '@clerk/clerk-sdk-node';
import { requireMasterAdmin } from '../middleware/requireMasterAdmin';
import { AuthenticatedRequest } from '../types/express'; // Ensure this path is correct

const router = express.Router();

if (!process.env.CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY is not defined in .env. User operations will fail.");
  // Optionally, you could throw an error here to prevent the app from starting
  // throw new Error("CLERK_SECRET_KEY is not defined. Please set it in your .env file.");
}

// Route to update a user's admin status
router.post('/update-user-role', requireMasterAdmin, async (req: AuthenticatedRequest, res) => {
    const { userIdToUpdate, isAdmin } = req.body;

    if (!userIdToUpdate || typeof isAdmin !== 'boolean') {
        return res.status(400).json({ error: 'Missing userIdToUpdate or isAdmin in request body, or isAdmin is not a boolean.' });
    }

    if (!process.env.CLERK_SECRET_KEY) {
        console.error("CLERK_SECRET_KEY is not set. Cannot update user metadata.");
        return res.status(500).json({ error: 'Server configuration error: Clerk Secret Key not set.' });
    }

    try {
        // The user making the request is authenticated as Master Admin by the middleware
        // Now, update the target user's metadata
        const updatedUser = await clerkClient.users.updateUserMetadata(userIdToUpdate, {
            publicMetadata: {
                isAdmin: isAdmin
            }
        });

        res.status(200).json({ message: 'User role updated successfully.', user: updatedUser });
    } catch (error: any) {
        console.error('Error updating user metadata:', error);
        // Check for specific Clerk error types if needed, or provide a generic message
        let errorMessage = 'Failed to update user role.';
        let statusCode = 500;

        if (error.status && error.errors && error.errors.length > 0) {
            statusCode = error.status;
            errorMessage = error.errors.map((e: any) => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(statusCode).json({ error: errorMessage });
    }
});

// Route to get all users (for Master Admin to manage them)
router.get('/list-users', requireMasterAdmin, async (req: AuthenticatedRequest, res) => {
    if (!process.env.CLERK_SECRET_KEY) {
        console.error("CLERK_SECRET_KEY is not set. Cannot list users.");
        return res.status(500).json({ error: 'Server configuration error: Clerk Secret Key not set.' });
    }
    try {
        // Parameters for pagination, can be adjusted or made configurable via query params
        const limit = 50; // Clerk API default is 10, max is 500
        let offset = 0;
        if (req.query.offset && !isNaN(Number(req.query.offset))) {
            offset = Number(req.query.offset);
        }

        const users = await clerkClient.users.getUserList({ limit, offset, orderBy: '+created_at' });
        const totalCount = await clerkClient.users.getCount();

        // We might want to simplify the user object returned to the frontend
        const simplifiedUsers = users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress,
            publicMetadata: user.publicMetadata,
            lastSignInAt: user.lastSignInAt,
            createdAt: user.createdAt,
        }));

        res.status(200).json({ users: simplifiedUsers, totalCount, limit, offset });
    } catch (error: any) {
        console.error('Error fetching user list:', error);
        let errorMessage = 'Failed to fetch user list.';
        let statusCode = 500;

        if (error.status && error.errors && error.errors.length > 0) {
            statusCode = error.status;
            errorMessage = error.errors.map((e: any) => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        res.status(statusCode).json({ error: errorMessage });
    }
});

export default router;
