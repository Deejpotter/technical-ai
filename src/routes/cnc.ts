/**
 * CNC API Routes
 * Updated: 08/08/2025
 * Author: Deej Potter / GitHub Copilot
 * Description: This file defines the Express routes for CNC machine related calculations and operations.
 */

import {
	Router,
	Request,
	Response,
	NextFunction,
	RequestHandler,
} from "express";
import {
	calculateTableMaterials,
	calculateEnclosureMaterials,
	calculateMountingMaterials,
	calculateDoorMaterials,
	Dimensions as TableEnclosureDimensions,
} from "../services/table-enclosure-calc"; // Changed from @/services/table-enclosure-calc

const router = Router();

/**
 * @swagger
 * tags:
 *   name: CNC
 *   description: CNC table and enclosure calculation APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TableEnclosureDimensions:
 *       type: object
 *       properties:
 *         length:
 *           type: number
 *           description: Length in millimeters.
 *         width:
 *           type: number
 *           description: Width in millimeters.
 *         height:
 *           type: number
 *           description: Height in millimeters.
 *         isOutsideDimension:
 *           type: boolean
 *           description: >
 *             Specifies if the given dimensions are outside (true) or inside (false) measurements.
 *             For enclosures and tables, height is always OD. Length and width interpretation depends on this flag.
 *       required:
 *         - length
 *         - width
 *         - height
 *         - isOutsideDimension
 *     DoorConfig:
 *       type: object
 *       properties:
 *         frontDoor:
 *           type: boolean
 *           default: false
 *         backDoor:
 *           type: boolean
 *           default: false
 *         leftDoor:
 *           type: boolean
 *           default: false
 *         rightDoor:
 *           type: boolean
 *           default: false
 *         doorType:
 *           type: string
 *           enum: [STND, BFLD, AWNG] # Standard, Bi-fold, Awning
 *           description: Type of door.
 *       required:
 *         - doorType
 *
 *     TableMaterialsRequest:
 *       type: object
 *       properties:
 *         dimensions:
 *           $ref: '#/components/schemas/TableEnclosureDimensions'
 *         isOutsideDimension:
 *           type: boolean
 *           description: Must match the isOutsideDimension within the dimensions object for clarity, or be used if dimensions object omits it.
 *       required:
 *         - dimensions
 *         - isOutsideDimension
 *
 *     EnclosureMaterialsRequest:
 *       type: object
 *       properties:
 *         dimensions:
 *           $ref: '#/components/schemas/TableEnclosureDimensions'
 *         isOutsideDimension:
 *           type: boolean
 *           description: Must match the isOutsideDimension within the dimensions object for clarity, or be used if dimensions object omits it.
 *       required:
 *         - dimensions
 *         - isOutsideDimension
 *
 *     DoorMaterialsRequest:
 *       type: object
 *       properties:
 *         dimensions:
 *           $ref: '#/components/schemas/TableEnclosureDimensions'
 *         isOutsideDimension:
 *           type: boolean
 *           description: Must match the isOutsideDimension within the dimensions object for clarity, or be used if dimensions object omits it.
 *         doorConfig:
 *           $ref: '#/components/schemas/DoorConfig'
 *       required:
 *         - dimensions
 *         - isOutsideDimension
 *         - doorConfig
 */

const calculateTableMaterialsHandler: RequestHandler = (req, res, next) => {
	try {
		// The service function expects dimensions Omit<TableEnclosureDimensions, 'isOutsideDimension'> and a separate isOutsideDimension boolean.
		// The request body should provide the full TableEnclosureDimensions object.
		const fullDimensions = req.body.dimensions as TableEnclosureDimensions;
		const isOutsideDimension = req.body.isOutsideDimension as boolean;

		if (
			!fullDimensions ||
			typeof fullDimensions.length !== "number" ||
			typeof fullDimensions.width !== "number" ||
			typeof fullDimensions.height !== "number" ||
			typeof fullDimensions.isOutsideDimension !== "boolean" ||
			typeof isOutsideDimension !== "boolean"
		) {
			res.status(400).json({
				error:
					"Invalid input: full dimensions object (length, width, height, isOutsideDimension) and a separate isOutsideDimension boolean are required.",
			});
			return;
		}
		// It's good practice to ensure the separate isOutsideDimension matches the one in the dimensions object if both are provided for this endpoint structure.
		if (fullDimensions.isOutsideDimension !== isOutsideDimension) {
			res.status(400).json({
				error:
					"Mismatch between isOutsideDimension in dimensions object and the separate isOutsideDimension parameter.",
			});
			return;
		}

		const { length, width, height } = fullDimensions;
		const materials = calculateTableMaterials(
			{ length, width, height },
			isOutsideDimension
		);
		res.json(materials);
	} catch (error) {
		next(error);
	}
};

const calculateEnclosureMaterialsHandler: RequestHandler = (req, res, next) => {
	try {
		const fullDimensions = req.body.dimensions as TableEnclosureDimensions;
		const isOutsideDimension = req.body.isOutsideDimension as boolean;

		if (
			!fullDimensions ||
			typeof fullDimensions.length !== "number" ||
			typeof fullDimensions.width !== "number" ||
			typeof fullDimensions.height !== "number" ||
			typeof fullDimensions.isOutsideDimension !== "boolean" ||
			typeof isOutsideDimension !== "boolean"
		) {
			res.status(400).json({
				error:
					"Invalid input: full dimensions object (length, width, height, isOutsideDimension) and a separate isOutsideDimension boolean are required.",
			});
			return;
		}
		if (fullDimensions.isOutsideDimension !== isOutsideDimension) {
			res.status(400).json({
				error:
					"Mismatch between isOutsideDimension in dimensions object and the separate isOutsideDimension parameter.",
			});
			return;
		}
		const { length, width, height } = fullDimensions;
		const materials = calculateEnclosureMaterials(
			{ length, width, height },
			isOutsideDimension
		);
		res.json(materials);
	} catch (error) {
		next(error);
	}
};

const calculateMountingMaterialsHandler: RequestHandler = (req, res, next) => {
	try {
		const materials = calculateMountingMaterials();
		res.json(materials);
	} catch (error) {
		next(error);
	}
};

const calculateDoorMaterialsHandler: RequestHandler = (req, res, next) => {
	try {
		const fullDimensions = req.body.dimensions as TableEnclosureDimensions;
		const isOutsideDimension = req.body.isOutsideDimension as boolean;
		const doorConfig = req.body.doorConfig as {
			frontDoor: boolean;
			backDoor: boolean;
			leftDoor: boolean;
			rightDoor: boolean;
			doorType: string;
		};

		if (
			!fullDimensions ||
			typeof fullDimensions.length !== "number" ||
			typeof fullDimensions.width !== "number" ||
			typeof fullDimensions.height !== "number" ||
			typeof fullDimensions.isOutsideDimension !== "boolean" ||
			typeof isOutsideDimension !== "boolean" ||
			!doorConfig ||
			typeof doorConfig.doorType !== "string"
		) {
			res.status(400).json({
				error:
					"Invalid input: full dimensions object, isOutsideDimension boolean, and doorConfig (with doorType) are required.",
			});
			return;
		}
		if (fullDimensions.isOutsideDimension !== isOutsideDimension) {
			res.status(400).json({
				error:
					"Mismatch between isOutsideDimension in dimensions object and the separate isOutsideDimension parameter.",
			});
			return;
		}

		const { length, width, height } = fullDimensions;
		const materials = calculateDoorMaterials(
			{ length, width, height },
			isOutsideDimension,
			doorConfig
		);
		res.json(materials);
	} catch (error) {
		next(error);
	}
};

/**
 * @swagger
 * /api/cnc/calculate-table-materials:
 *   post:
 *     summary: Calculate materials for a CNC table.
 *     tags: [CNC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableMaterialsRequest'
 *     responses:
 *       200:
 *         description: Successfully calculated table materials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Define specific response schema based on calculateTableMaterials output
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.post("/calculate-table-materials", calculateTableMaterialsHandler);

/**
 * @swagger
 * /api/cnc/calculate-enclosure-materials:
 *   post:
 *     summary: Calculate materials for a CNC enclosure.
 *     tags: [CNC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnclosureMaterialsRequest'
 *     responses:
 *       200:
 *         description: Successfully calculated enclosure materials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Define specific response schema based on calculateEnclosureMaterials output
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.post(
	"/calculate-enclosure-materials",
	calculateEnclosureMaterialsHandler
);

/**
 * @swagger
 * /api/cnc/calculate-mounting-materials:
 *   get:
 *     summary: Calculate materials for mounting an enclosure to a table.
 *     tags: [CNC]
 *     responses:
 *       200:
 *         description: Successfully calculated mounting materials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Define specific response schema based on calculateMountingMaterials output
 *       500:
 *         description: Internal server error.
 */
router.get("/calculate-mounting-materials", calculateMountingMaterialsHandler);

/**
 * @swagger
 * /api/cnc/calculate-door-materials:
 *   post:
 *     summary: Calculate materials for enclosure doors.
 *     tags: [CNC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoorMaterialsRequest'
 *     responses:
 *       200:
 *         description: Successfully calculated door materials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Define specific response schema based on calculateDoorMaterials output
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.post("/calculate-door-materials", calculateDoorMaterialsHandler);

export default router;
