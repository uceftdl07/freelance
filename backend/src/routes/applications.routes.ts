import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createApplication,
  getMyApplications,
  getApplicationsForJob,
  getReceivedApplications,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
} from "../controllers/applications.controller";

const router = Router();

/**
 * @route   GET /api/applications/mine
 * @desc    Candidate lists own applications
 * @access  Private (CANDIDAT)
 */
router.get("/mine", authMiddleware, requireRole("CANDIDAT"), getMyApplications);

/**
 * @route   GET /api/applications/received
 * @desc    Recruiter aggregate of applications across owned jobs
 * @access  Private (RECRUTEUR)
 */
router.get("/received", authMiddleware, requireRole("RECRUTEUR"), getReceivedApplications);

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Recruiter lists applications received for a job
 * @access  Private (RECRUTEUR + owner)
 */
router.get("/job/:jobId", authMiddleware, requireRole("RECRUTEUR"), getApplicationsForJob);

/**
 * @route   POST /api/applications
 * @desc    Candidate applies to a job
 * @access  Private (CANDIDAT)
 */
router.post("/", authMiddleware, requireRole("CANDIDAT"), createApplication);

/**
 * @route   PATCH /api/applications/:id
 * @desc    Candidate updates their pending application
 * @access  Private (CANDIDAT + owner)
 */
router.patch("/:id", authMiddleware, requireRole("CANDIDAT"), updateApplication);

/**
 * @route   DELETE /api/applications/:id
 * @desc    Candidate withdraws their application
 * @access  Private (CANDIDAT + owner)
 */
router.delete("/:id", authMiddleware, requireRole("CANDIDAT"), deleteApplication);

/**
 * @route   PATCH /api/applications/:id/status
 * @desc    Recruiter updates application status
 * @access  Private (RECRUTEUR + job owner)
 */
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("RECRUTEUR"),
  updateApplicationStatus
);

export default router;

