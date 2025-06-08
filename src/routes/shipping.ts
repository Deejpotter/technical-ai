/**
 * Shipping API Routes
 * Updated: 08/08/2025
 * Author: Deej Potter / GitHub Copilot
 * Description: This file defines the Express routes for shipping-related functionalities, such as item management and box calculations.
 */

/**
 * Shipping Items API Routes
 * Provides endpoints for managing shipping items.
 * Updated: 2025-06-08 by Daniel
 * - Implemented GET /items to fetch all available shipping items.
 */
import {
	Router,
	Request,
	Response,
	NextFunction,
	RequestHandler,
} from "express"; // Added RequestHandler
import { DataService } from "../data/DataService";
import ShippingItem from "../types/ShippingItem";
import { DatabaseResponse } from "../types/mongodb";
import {
	findBestBox,
	packItemsIntoMultipleBoxes,
	standardBoxes as availableBoxes,
} from "../services/box-shipping-calculations";
import { MultiBoxPackingResult } from "../types/box-shipping-types";
import ShippingBox from "../types/ShippingBox";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Shipping and box calculation APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ShippingItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the shipping item (can be MongoDB ObjectID or any string).
 *         name:
 *           type: string
 *           description: Name of the item.
 *         length:
 *           type: number
 *           description: Length of the item in millimeters.
 *         width:
 *           type: number
 *           description: Width of the item in millimeters.
 *         height:
 *           type: number
 *           description: Height of the item in millimeters.
 *         weight:
 *           type: number
 *           description: Weight of the item in grams.
 *         quantity:
 *           type: number
 *           description: Number of units of this item.
 *           default: 1
 *       required:
 *         - name
 *         - length
 *         - width
 *         - height
 *         - weight
 *     ShippingBox:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the shipping box.
 *         name:
 *           type: string
 *           description: Name of the box type (e.g., "Small Box", "Padded Satchel").
 *         length:
 *           type: number
 *           description: Internal length of the box in millimeters.
 *         width:
 *           type: number
 *           description: Internal width of the box in millimeters.
 *         height:
 *           type: number
 *           description: Internal height of the box in millimeters.
 *         maxWeight:
 *           type: number
 *           description: Maximum weight capacity of the box in grams.
 *       required:
 *         - _id
 *         - name
 *         - length
 *         - width
 *         - height
 *         - maxWeight
 *     BestBoxResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         box:
 *           $ref: '#/components/schemas/ShippingBox'
 *         packedItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShippingItem'
 *         unfitItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShippingItem'
 *     MultiBoxPackingResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         shipments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               box:
 *                 $ref: '#/components/schemas/ShippingBox'
 *               packedItems:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ShippingItem'
 *         unfitItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShippingItem'
 */

const getShippingItems: RequestHandler = async (req, res, next) => {
	try {
		const response: DatabaseResponse<ShippingItem[]> =
			await DataService.shippingItems.getAvailable();
		if (response.success) {
			res.status(response.status || 200).json(response);
		} else {
			res.status(response.status || 500).json(response);
		}
	} catch (error) {
		next(error);
	}
};

const getAvailableBoxes: RequestHandler = (req, res, next) => {
	try {
		res.status(200).json(availableBoxes);
	} catch (error) {
		next(error);
	}
};

const calculateBestBoxHandler: RequestHandler = (req, res, next) => {
	try {
		const itemsToPack: ShippingItem[] = req.body;
		if (!Array.isArray(itemsToPack) || itemsToPack.length === 0) {
			res.status(400).json({
				success: false,
				message: "Request body must be a non-empty array of ShippingItem.",
			});
			return;
		}
		// TODO: Add more detailed validation for each item in itemsToPack
		const result = findBestBox(itemsToPack);
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

const packMultipleBoxesHandler: RequestHandler = (req, res, next) => {
	try {
		const itemsToPack: ShippingItem[] = req.body;
		if (!Array.isArray(itemsToPack) || itemsToPack.length === 0) {
			res.status(400).json({
				success: false,
				message: "Request body must be a non-empty array of ShippingItem.",
			});
			return;
		}
		// TODO: Add more detailed validation for each item in itemsToPack
		const result: MultiBoxPackingResult =
			packItemsIntoMultipleBoxes(itemsToPack);
		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
};

/**
 * @route GET /api/shipping/items
 * @description Get all available (non-deleted) shipping items.
 * @access Public
 * @swagger
 * /api/shipping/items:
 *   get:
 *     summary: Get all available shipping items
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: A list of shipping items.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShippingItem'
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 */
router.get("/items", getShippingItems);

/**
 * @swagger
 * /api/shipping/boxes:
 *   get:
 *     summary: Get all available standard shipping boxes
 *     tags: [Shipping]
 *     responses:
 *       200:
 *         description: A list of standard shipping boxes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShippingBox'
 *       500:
 *         description: Internal server error.
 */
router.get("/boxes", getAvailableBoxes);

/**
 * @swagger
 * /api/shipping/calculate-best-box:
 *   post:
 *     summary: Calculate the best single box for a list of items.
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/ShippingItem'
 *     responses:
 *       200:
 *         description: The best box and packing details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BestBoxResponse'
 *       400:
 *         description: Invalid input, e.g., empty item list or invalid item structure.
 *       500:
 *         description: Internal server error.
 */
router.post("/calculate-best-box", calculateBestBoxHandler);

/**
 * @swagger
 * /api/shipping/pack-multiple-boxes:
 *   post:
 *     summary: Pack items into multiple boxes if necessary.
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/ShippingItem'
 *     responses:
 *       200:
 *         description: Packing result with shipments and any unfit items.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MultiBoxPackingResult'
 *       400:
 *         description: Invalid input, e.g., empty item list or invalid item structure.
 *       500:
 *         description: Internal server error.
 */
router.post("/pack-multiple-boxes", packMultipleBoxesHandler);

// TODO: Implement POST /api/shipping/items to add a new item
// TODO: Implement PUT /api/shipping/items/:id to update an item
// TODO: Implement DELETE /api/shipping/items/:id to delete an item

export default router;
