/**
 * Main Express Application
 * Updated: 08/06/2025
 * Author: Deej Potter
 * Description: This file initializes and configures the Express application, including middleware and route setup.
 */
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai";
import cncRoutes from "./routes/cnc";
import shippingRoutes from "./routes/shipping";

const app = express();
app.use(cors());
app.use(express.json());

// Mount API routes
app.use("/api/ai", aiRoutes);
app.use("/api/cnc", cncRoutes);
app.use("/api/shipping", shippingRoutes);

// Start the server on the specified port.
const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Express server listening on port ${port}`);
});

// Export app for testing purposes (Jest, Supertest, etc.)
export default app;
