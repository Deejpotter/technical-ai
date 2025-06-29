import express, { Router } from "express";
import multer from "multer";
import { AuthenticatedRequest } from "../types/express";
import { requireAuth } from "../middleware/clerkAuth"; // Assuming clerkAuth.ts is in middleware
import { processInvoiceFileModular } from "../services/invoiceService";

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

// Best practice: All async route handlers are typed as Promise<void> and never return a value.
// Always end each response with 'return;' to avoid TypeScript/Express type errors.
router.post(
	"/process-pdf",
	requireAuth(),
	upload.single("invoiceFile"),
	async (req, res, next): Promise<void> => {
		console.log(
			`[Invoice] /process-pdf called. User: ${
				(req as any).auth?.userId
			}, File:`,
			req.file?.originalname
		);

		/**
		 * TypeScript/Express type compatibility:
		 * Express expects handlers to use the base Request type, but the requireAuth middleware attaches Clerk auth info.
		 * I cast req to AuthenticatedRequest to access Clerk fields, and check for presence at runtime.
		 *
		 * Best practice: Never return a value from this handler. Always end with 'return;' after sending a response.
		 */
		const authReq = req as AuthenticatedRequest;
		if (!authReq.file) {
			res.status(400).json({ error: "No file uploaded." });
			return;
		}

		if (!authReq.auth || !authReq.auth.userId) {
			res.status(401).json({ error: "User not authenticated." });
			return;
		}

		const fileBuffer = authReq.file.buffer;
		const fileType = authReq.file.mimetype;
		const fileName = authReq.file.originalname;

		try {
			console.log(
				`Processing PDF for user: ${authReq.auth.userId}, filename: ${fileName}`
			);
			const extractedItems = await processInvoiceFileModular(
				fileBuffer,
				fileType,
				fileName
			);
			res.status(200).json(extractedItems);
			return;
		} catch (error: any) {
			console.error("[Invoice] Error processing invoice PDF:", error);
			if (error.message.includes("Unsupported file type")) {
				res.status(400).json({ error: error.message });
				return;
			}
			if (error.message.includes("Failed to extract text")) {
				res.status(500).json({
					error: "Failed to extract text from file.",
					details: error.message,
				});
				return;
			}
			if (error.message.includes("Failed to process text with AI")) {
				res
					.status(500)
					.json({ error: "AI processing failed.", details: error.message });
				return;
			}
			if (error.message.includes("OpenAI response format is invalid")) {
				res
					.status(500)
					.json({ error: "AI response format error.", details: error.message });
				return;
			}
			res
				.status(500)
				.json({ error: "Failed to process invoice.", details: error.message });
			return;
		}
	}
);

export default router;
