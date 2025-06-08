/**
 * Main Express App
 * Integrates all API routes for CNC Technical AI backend.
 */
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

// ...existing code for error handling, etc...

export default app;
