/**
 * Shipping API Routes
 * Updated: 08/08/2025
 * Author: Deej Potter
 * Description: This file defines the Express routes for shipping-related functionalities, such as item management and box calculations.
 */

import {
	Router,
	Request,
	Response,
	NextFunction,
	RequestHandler,
} from "express";
import multer from "multer";
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
import { processInvoiceFileModular } from "../services/invoiceService";

const router = Router();

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept PDF and text files
		const allowedTypes = ["application/pdf", "text/plain"];
		const allowedExtensions = [".pdf", ".txt", ".text"];

		const isValidMimeType = allowedTypes.includes(file.mimetype);
		const isValidExtension = allowedExtensions.some((ext) =>
			file.originalname.toLowerCase().endsWith(ext)
		);

		if (isValidMimeType || isValidExtension) {
			cb(null, true);
		} else {
			cb(new Error("Only PDF and text files are allowed"));
		}
	},
});

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

/**
 * Processes an uploaded invoice file (PDF or TXT) to extract shipping items.
 * This single endpoint handles file parsing, text extraction, and AI-based item processing.
 * @param {Express.Multer.File} req.file - The uploaded invoice file.
 */
const processInvoice: RequestHandler = async (req, res, next) => {
	try {
		if (!req.file) {
			res.status(400).json({
				success: false,
				message: "No file uploaded. Please upload an invoice file.",
			});
			return;
		}

		const { buffer, mimetype, originalname } = req.file;

		// Use the modular invoice service to process the file
		// This function handles: text extraction, personal data removal, item parsing,
		// DB lookups, AI estimation, and adding new items to DB as needed
		const processedItems = await processInvoiceFileModular(
			buffer,
			mimetype,
			originalname
		);

		// Convert the processed items to the format expected by the frontend
		// Note: processInvoiceFileModular already handles DB integration and preserves quantities
		const finalShippingItems = processedItems.map((item, index) => ({
			_id: `temp_invoice_${item.sku}_${index}`, // Temporary ID for frontend using index instead of timestamp
			name: item.name,
			sku: item.sku,
			length: item.length,
			width: item.width,
			height: item.height,
			weight: item.weight * 1000, // Convert kg back to grams for frontend consistency
			quantity: item.quantity,
		}));

		// Debug: Log what we're sending to the frontend
		console.log(
			"[Backend] Sending to frontend:",
			JSON.stringify(finalShippingItems, null, 2)
		);

		res.status(200).json({
			success: true,
			data: finalShippingItems,
			message: `Successfully processed invoice and extracted ${finalShippingItems.length} items.`,
		});
	} catch (error) {
		console.error("Error processing invoice file:", error);
		res.status(500).json({
			success: false,
			data: [],
			message:
				error instanceof Error
					? error.message
					: "An unexpected error occurred during invoice processing.",
		});
	}
};

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
 * @route PUT /api/shipping/items/:id
 * @description Update an existing shipping item.
 * @access Public
 * @swagger
 * /api/shipping/items/{id}:
 *   put:
 *     summary: Update an existing shipping item
 *     tags: [Shipping]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the shipping item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShippingItem'
 *     responses:
 *       200:
 *         description: Successfully updated the shipping item.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ShippingItem'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (invalid item data).
 *       404:
 *         description: Item not found.
 *       500:
 *         description: Internal server error.
 */
const updateShippingItem: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const itemData = req.body;

		// Basic validation
		if (!id) {
			res.status(400).json({
				success: false,
				error: "Item ID is required",
				message: "Please provide a valid item ID",
			});
			return;
		}

		// Ensure the item has the ID from the URL
		const itemToUpdate: ShippingItem = {
			...itemData,
			_id: id,
		};

		const response: DatabaseResponse<ShippingItem> =
			await DataService.shippingItems.update(itemToUpdate);

		if (response.success) {
			res.status(response.status || 200).json(response);
		} else {
			res.status(response.status || 500).json(response);
		}
	} catch (error) {
		next(error);
	}
};

/**
 * @route DELETE /api/shipping/items/:id
 * @description Delete (soft delete) a shipping item.
 * @access Public
 * @swagger
 * /api/shipping/items/{id}:
 *   delete:
 *     summary: Delete a shipping item (soft delete)
 *     tags: [Shipping]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the shipping item to delete
 *     responses:
 *       200:
 *         description: Successfully deleted the shipping item.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ShippingItem'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (invalid item ID).
 *       404:
 *         description: Item not found.
 *       500:
 *         description: Internal server error.
 */
const deleteShippingItem: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Basic validation
		if (!id) {
			res.status(400).json({
				success: false,
				error: "Item ID is required",
				message: "Please provide a valid item ID",
			});
			return;
		}

		const response: DatabaseResponse<ShippingItem> =
			await DataService.shippingItems.delete(id);

		if (response.success) {
			res.status(response.status || 200).json(response);
		} else {
			res.status(response.status || 500).json(response);
		}
	} catch (error) {
		next(error);
	}
};

/**
 * @route POST /api/shipping/items
 * @description Add a new shipping item.
 * @access Public
 * @swagger
 * /api/shipping/items:
 *   post:
 *     summary: Add a new shipping item
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the item.
 *               sku:
 *                 type: string
 *                 description: SKU of the item.
 *               length:
 *                 type: number
 *                 description: Length of the item in millimeters.
 *               width:
 *                 type: number
 *                 description: Width of the item in millimeters.
 *               height:
 *                 type: number
 *                 description: Height of the item in millimeters.
 *               weight:
 *                 type: number
 *                 description: Weight of the item in grams.
 *             required:
 *               - name
 *               - length
 *               - width
 *               - height
 *               - weight
 *     responses:
 *       201:
 *         description: Successfully created the shipping item.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ShippingItem'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (invalid item data).
 *       500:
 *         description: Internal server error.
 */
const addShippingItem: RequestHandler = async (req, res, next) => {
	try {
		const itemData = req.body;

		// Basic validation
		const requiredFields = ["name", "length", "width", "height", "weight"];
		const missingFields = requiredFields.filter((field) => !itemData[field]);

		if (missingFields.length > 0) {
			res.status(400).json({
				success: false,
				error: "Missing required fields",
				message: `The following fields are required: ${missingFields.join(
					", "
				)}`,
			});
			return;
		}

		const response: DatabaseResponse<ShippingItem> =
			await DataService.shippingItems.add(itemData);

		if (response.success) {
			res.status(201).json(response);
		} else {
			res.status(response.status || 500).json(response);
		}
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
 * /api/shipping/process-invoice:
 *   post:
 *     summary: Process an invoice file (PDF or TXT) to extract item details
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               invoice:
 *                 type: string
 *                 format: binary
 *                 description: The invoice file (PDF or TXT) to process.
 *     responses:
 *       200:
 *         description: Successfully processed the invoice and returned extracted items.
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
 *       400:
 *         description: Bad request (e.g., no file uploaded).
 *       500:
 *         description: Internal server error during processing.
 */
router.post("/process-invoice", upload.single("invoice"), processInvoice);

/**
 * Route endpoints for shipping items
 */
router.post("/items", addShippingItem);
router.put("/items/:id", updateShippingItem);
router.delete("/items/:id", deleteShippingItem);

// Log all incoming shipping requests
router.use((req, res, next) => {
	console.log(`[Shipping] ${req.method} ${req.originalUrl}`);
	next();
});

export default router;
