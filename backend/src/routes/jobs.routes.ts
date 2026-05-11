import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createJobOffer,
  getJobOffers,
  getJobOfferById,
  getMyJobOffers,
  updateJobOffer,
  deleteJobOffer,
} from "../controllers/jobs.controller";

const router = Router();

/**
 * @route   GET /api/jobs
 * @desc    Get all active job offers (with optional filtering)
 * @access  Public
 * @query   search, location, contractType, remote, tags
 */
router.get("/", getJobOffers);

/**
 * @route   GET /api/jobs/mine
 * @desc    Get the authenticated recruiter's job offers
 * @access  Private (JWT + RECRUTEUR)
 */
router.get("/mine", authMiddleware, requireRole("RECRUTEUR"), getMyJobOffers);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get a single job offer by id
 * @access  Public
 */
router.get("/:id", getJobOfferById);

/**
 * @route   POST /api/jobs
 * @desc    Create a new job offer
 * @access  Private (JWT + RECRUTEUR)
 */
router.post("/", authMiddleware, requireRole("RECRUTEUR"), createJobOffer);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update a job offer
 * @access  Private (JWT + owner)
 */
router.put("/:id", authMiddleware, requireRole("RECRUTEUR"), updateJobOffer);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job offer
 * @access  Private (JWT + owner)
 */
router.delete("/:id", authMiddleware, requireRole("RECRUTEUR"), deleteJobOffer);

export default router;
