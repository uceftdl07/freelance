import { Router } from "express";
import { getTjmStats, getOverviewStats } from "../controllers/stats.controller";

const router = Router();

router.get("/tjm", getTjmStats);
router.get("/overview", getOverviewStats);

export default router;
