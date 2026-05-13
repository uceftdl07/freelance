import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { optimizeProfile, optimizeMission, analyzeCv } from "../controllers/ai.controller";

const router = Router();

// All AI endpoints require authentication
router.post("/optimize-profile", authMiddleware, optimizeProfile);
router.post("/optimize-mission", authMiddleware, optimizeMission);
router.post("/analyze-cv", authMiddleware, analyzeCv);

export default router;
