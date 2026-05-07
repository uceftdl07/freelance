import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import { matchCandidatesForJob, quickMatch } from "../controllers/matching.controller";
import {
  sendMessage, getMyMessages,
  saveCandidate, removeSavedCandidate, getSavedCandidates,
  getNotifications, markNotificationsRead,
} from "../controllers/messaging.controller";

const router = Router();

// ─── Matching ─────────────────────────────────

/** Match candidates for a specific job offer */
router.get("/match/job/:jobId", authMiddleware, requireRole("RECRUTEUR"), matchCandidatesForJob);

/** Quick match by skills array */
router.post("/match/quick", authMiddleware, requireRole("RECRUTEUR"), quickMatch);

// ─── Messaging ────────────────────────────────

/** Send a message */
router.post("/messages", authMiddleware, sendMessage);

/** Get my received messages */
router.get("/messages", authMiddleware, getMyMessages);

// ─── Save Candidate ──────────────────────────

/** Save a candidate profile */
router.post("/save-candidate", authMiddleware, requireRole("RECRUTEUR"), saveCandidate);

/** Remove a saved candidate profile */
router.delete("/saved-candidates/:candidateId", authMiddleware, requireRole("RECRUTEUR"), removeSavedCandidate);

/** List my saved candidate profiles */
router.get("/saved-candidates", authMiddleware, requireRole("RECRUTEUR"), getSavedCandidates);

// ─── Notifications ────────────────────────────

/** Get my notifications */
router.get("/notifications", authMiddleware, getNotifications);

/** Mark all notifications as read */
router.put("/notifications/read", authMiddleware, markNotificationsRead);

export default router;
