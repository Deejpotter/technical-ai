import express, { Router } from "express";
import multer from "multer";
import { AuthenticatedRequest } from "../types/express";
import { requireAuth } from "../middleware/clerkAuth"; // Assuming clerkAuth.ts is in middleware
import { processInvoiceFileAndExtractItems } from "../services/invoiceService";

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
	fileFilter: (req, file, cb) => {
		if (file.mimetype === "application/pdf" || file.mimetype === "text/plain") {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Only PDF and TXT files are allowed."));
		}
	},
});

router.post(
	"/process-pdf",
	requireAuth,
	upload.single("invoiceFile"), // 'invoiceFile' is the name of the field in the form-data
	async (req: AuthenticatedRequest, res) => {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded." });
		}

		if (!req.auth || !req.auth.userId) {
			return res.status(401).json({ error: "User not authenticated." });
		}

		const userId = req.auth.userId;
		const fileBuffer = req.file.buffer;
		const fileType = req.file.mimetype;
		const fileName = req.file.originalname;

		try {
			console.log(`Processing PDF for user: ${userId}, filename: ${fileName}`);
			const extractedItems = await processInvoiceFileAndExtractItems(
				fileBuffer,
				fileType,
				fileName,
				userId
			);
			res.status(200).json(extractedItems);
		} catch (error: any) {
			console.error("Error processing invoice PDF:", error);
			if (error.message.includes("Unsupported file type")) {
				return res.status(400).json({ error: error.message });
			}
			if (error.message.includes("Failed to extract text")) {
				return res
					.status(500)
					.json({
						error: "Failed to extract text from file.",
						details: error.message,
					});
			}
			if (error.message.includes("Failed to process text with AI")) {
				return res
					.status(500)
					.json({ error: "AI processing failed.", details: error.message });
			}
			if (error.message.includes("OpenAI response format is invalid")) {
				return res
					.status(500)
					.json({ error: "AI response format error.", details: error.message });
			}
			res
				.status(500)
				.json({ error: "Failed to process invoice.", details: error.message });
		}
	}
);

export default router;
