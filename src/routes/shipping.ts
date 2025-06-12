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
 * Handler for extracting invoice items using AI from text content
 */
const extractInvoiceItems: RequestHandler = async (req, res, next) => {
	try {
		const { text } = req.body;

		if (!text || typeof text !== "string") {
			res.status(400).json({
				success: false,
				message: "Text content is required for invoice extraction",
			});
			return;
		}

		// Use the existing invoice processing service to extract items from text
		const { extractInvoiceItemsFromText } = await import(
			"../services/invoiceService"
		);
		const extractedItems = await extractInvoiceItemsFromText(text);

		res.status(200).json({
			success: true,
			data: extractedItems,
			message: `Successfully extracted ${extractedItems.length} items from invoice text`,
		});
	} catch (error) {
		console.error("Error extracting invoice items:", error);
		res.status(500).json({
			success: false,
			data: [],
			message:
				error instanceof Error
					? error.message
					: "Failed to extract invoice items",
		});
	}
};

/**
 * Handler for getting item dimensions based on SKUs
 */
const getItemDimensions: RequestHandler = async (req, res, next) => {
	try {
		const { extractedItems } = req.body;

		if (!Array.isArray(extractedItems)) {
			res.status(400).json({
				success: false,
				message: "extractedItems must be an array",
			});
			return;
		}

		// Use the existing invoice processing service to get dimensions
		const { getOrCreateShippingItemsFromInvoice } = await import(
			"../services/invoiceService"
		);
		const shippingItems = await getOrCreateShippingItemsFromInvoice(
			extractedItems
		);

		res.status(200).json({
			success: true,
			data: shippingItems,
			message: `Successfully processed ${shippingItems.length} shipping items`,
		});
	} catch (error) {
		console.error("Error getting item dimensions:", error);
		res.status(500).json({
			success: false,
			data: [],
			message:
				error instanceof Error
					? error.message
					: "Failed to get item dimensions",
		});
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

/**
 * @swagger
 * /api/shipping/extract-invoice-items:
 *   post:
 *     summary: Extract items from invoice text using AI
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text content extracted from the invoice
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: Invoice items extraction result
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
 *                     type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post("/extract-invoice-items", extractInvoiceItems);

/**
 * @swagger
 * /api/shipping/get-item-dimensions:
 *   post:
 *     summary: Get item dimensions based on SKUs
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               extractedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sku:
 *                       type: string
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *             required:
 *               - extractedItems
 *     responses:
 *       200:
 *         description: Item dimensions lookup result
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
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post("/get-item-dimensions", getItemDimensions);

/**
 * Handler for creating a new shipping item
 */
const createShippingItem: RequestHandler = async (req, res, next) => {
	try {
		const itemData: Omit<
			ShippingItem,
			"_id" | "createdAt" | "updatedAt" | "deletedAt"
		> = req.body;

		// Validate required fields
		if (
			!itemData.name ||
			!itemData.length ||
			!itemData.width ||
			!itemData.height ||
			!itemData.weight
		) {
			res.status(400).json({
				success: false,
				message: "Missing required fields: name, length, width, height, weight",
			});
			return;
		}

		// Validate positive numeric values
		if (
			itemData.length <= 0 ||
			itemData.width <= 0 ||
			itemData.height <= 0 ||
			itemData.weight <= 0
		) {
			res.status(400).json({
				success: false,
				message: "Length, width, height, and weight must be positive numbers",
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
 * Handler for updating an existing shipping item
 */
const updateShippingItem: RequestHandler = async (req, res, next) => {
	try {
		const itemId = req.params.id;
		const updateData: Partial<ShippingItem> = req.body;

		if (!itemId) {
			res.status(400).json({
				success: false,
				message: "Item ID is required",
			});
			return;
		}

		// Add the _id to the update data for the DataService method
		const itemToUpdate: ShippingItem = {
			...updateData,
			_id: itemId,
		} as ShippingItem;

		// Validate numeric values if provided
		if (updateData.length !== undefined && updateData.length <= 0) {
			res.status(400).json({
				success: false,
				message: "Length must be a positive number",
			});
			return;
		}
		if (updateData.width !== undefined && updateData.width <= 0) {
			res.status(400).json({
				success: false,
				message: "Width must be a positive number",
			});
			return;
		}
		if (updateData.height !== undefined && updateData.height <= 0) {
			res.status(400).json({
				success: false,
				message: "Height must be a positive number",
			});
			return;
		}
		if (updateData.weight !== undefined && updateData.weight <= 0) {
			res.status(400).json({
				success: false,
				message: "Weight must be a positive number",
			});
			return;
		}

		const response: DatabaseResponse<ShippingItem> =
			await DataService.shippingItems.update(itemToUpdate);

		if (response.success) {
			res.status(200).json(response);
		} else {
			res.status(response.status || 500).json(response);
		}
	} catch (error) {
		next(error);
	}
};

/**
 * Handler for deleting a shipping item (soft delete)
 */
const deleteShippingItem: RequestHandler = async (req, res, next) => {
	try {
		const itemId = req.params.id;

		if (!itemId) {
			res.status(400).json({
				success: false,
				message: "Item ID is required",
			});
			return;
		}

		const response: DatabaseResponse<ShippingItem> =
			await DataService.shippingItems.delete(itemId);

		if (response.success) {
			res.status(200).json(response);
		} else {
			res.status(response.status || 500).json(response);
		}
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /api/shipping/items:
 *   post:
 *     summary: Create a new shipping item
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
 *               length:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               weight:
 *                 type: number
 *               quantity:
 *                 type: number
 *                 default: 1
 *               sku:
 *                 type: string
 *             required:
 *               - name
 *               - length
 *               - width
 *               - height
 *               - weight
 *     responses:
 *       201:
 *         description: Item created successfully
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
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post("/items", createShippingItem);

/**
 * @swagger
 * /api/shipping/items/{id}:
 *   put:
 *     summary: Update an existing shipping item
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               length:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               weight:
 *                 type: number
 *               quantity:
 *                 type: number
 *               sku:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
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
 *         description: Invalid input data
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.put("/items/:id", updateShippingItem);

/**
 * @swagger
 * /api/shipping/items/{id}:
 *   delete:
 *     summary: Delete a shipping item (soft delete)
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.delete("/items/:id", deleteShippingItem);

/**
 * Handler for processing invoice PDF files directly
 * This endpoint handles the full PDF-to-ShippingItems workflow
 */
const processInvoicePDF: RequestHandler = async (req, res, next) => {
	try {
		if (!req.file) {
			res.status(400).json({
				success: false,
				message: "No file uploaded. Please upload a PDF or text file.",
			});
			return;
		}

		const { buffer, originalname, mimetype } = req.file;
		const isValidType =
			mimetype === "application/pdf" ||
			mimetype === "text/plain" ||
			originalname.toLowerCase().endsWith(".pdf") ||
			originalname.toLowerCase().endsWith(".txt");

		if (!isValidType) {
			res.status(400).json({
				success: false,
				message: "Invalid file type. Please upload a PDF or text file.",
			});
			return;
		}

		// Use the existing invoice processing service
		const {
			extractTextFromFile,
			extractInvoiceItemsFromText,
			estimateItemDimensionsAI,
			getOrCreateShippingItemsFromInvoice,
		} = await import("../services/invoiceService");
		const text = await extractTextFromFile(buffer, mimetype, originalname);
		const extractedItems = await extractInvoiceItemsFromText(text);
		const itemsWithDimensions = await estimateItemDimensionsAI(extractedItems);
		const shippingItems = await getOrCreateShippingItemsFromInvoice(
			itemsWithDimensions
		);

		res.status(200).json({
			success: true,
			data: shippingItems,
			message: `Successfully processed invoice and extracted ${shippingItems.length} items`,
		});
	} catch (error) {
		console.error("Error processing invoice PDF:", error);
		res.status(500).json({
			success: false,
			data: [],
			message:
				error instanceof Error
					? error.message
					: "Failed to process invoice file",
		});
	}
};

/**
 * @swagger
 * /api/shipping/process-invoice-pdf:
 *   post:
 *     summary: Process PDF or text file to extract shipping items
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF or text file containing invoice data
 *     responses:
 *       200:
 *         description: Successfully processed invoice file
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
 *         description: Bad request - invalid file or missing file
 *       500:
 *         description: Internal server error
 */
router.post("/process-invoice-pdf", upload.single("file"), processInvoicePDF);

export default router;
