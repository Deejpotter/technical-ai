/**
 * Shipping Items API Routes
 * Provides endpoints for managing shipping items.
 * Updated: 2025-06-08 by Daniel
 * - Implemented GET /items to fetch all available shipping items.
 */
import { Router, Request, Response } from "express";
import { DataService } from "../data/DataService"; // Adjusted import path
import ShippingItem from "../types/ShippingItem"; // Adjusted import path
import { DatabaseResponse } from "../types/mongodb"; // Adjusted import path

const router = Router();

/**
 * @route GET /api/shipping/items
 * @description Get all available (non-deleted) shipping items.
 * @access Public
 */
router.get("/items", async (req: Request, res: Response) => {
	try {
		// NOTE: Ensure DataService.shippingItems.getAvailable is fully migrated and functional
		const response: DatabaseResponse<ShippingItem[]> =
			await DataService.shippingItems.getAvailable();
		if (response.success) {
			res.status(response.status || 200).json(response);
		} else {
			res.status(response.status || 500).json(response);
		}
	} catch (error) {
		console.error("Error fetching shipping items:", error);
		const errResponse: DatabaseResponse<null> = {
			success: false,
			message:
				"Failed to fetch shipping items due to an internal server error.",
			error: error instanceof Error ? error.message : "Unknown error",
			status: 500,
			data: null,
		};
		res.status(500).json(errResponse);
	}
});

// TODO: Implement POST /api/shipping/items to add a new item
// TODO: Implement PUT /api/shipping/items/:id to update an item
// TODO: Implement DELETE /api/shipping/items/:id to delete an item

export default router;
