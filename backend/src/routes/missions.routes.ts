import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getMyMissions, getMission, updateMissionStatus, upsertTimesheet, submitTimesheet, validateTimesheet, rejectTimesheet } from "../controllers/missions.controller";

const router = Router();
router.use(authMiddleware);

router.get("/mine", getMyMissions);
router.get("/:id", getMission);
router.patch("/:id/status", updateMissionStatus);
router.post("/timesheets", upsertTimesheet);
router.patch("/timesheets/:id/submit", submitTimesheet);
router.patch("/timesheets/:id/validate", validateTimesheet);
router.patch("/timesheets/:id/reject", rejectTimesheet);

export default router;
