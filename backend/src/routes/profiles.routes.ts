import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createPublicProfile, listPublicProfiles, getPublicProfile, getPublicRecruiterProfile, linkedInImportProfile } from "../controllers/profiles.controller";

const router = Router();

/**
 * @route   POST /api/profiles
 * @desc    Create a candidate profile
 * @access  Private (JWT required)
 */
router.post("/", authMiddleware, createPublicProfile);

/**
 * @route   POST /api/profiles/linkedin-import
 * @desc    Import LinkedIn profile data via OAuth code
 * @access  Private (JWT required)
 */
router.post("/linkedin-import", authMiddleware, linkedInImportProfile);

/**
 * @route   GET /api/profiles
 * @desc    List candidates with optional filters (public, in-memory for MVP)
 * @query   skills, availability, location, search, minExperience, maxExperience
 */
router.get("/", listPublicProfiles);

/**
 * @route   GET /api/profiles/recruiter/:id
 * @desc    Public recruiter company profile (no auth)
 */
router.get("/recruiter/:id", getPublicRecruiterProfile);

/**
 * @route   GET /api/profiles/:id
 * @desc    Public candidate profile (no auth)
 */
router.get("/:id", getPublicProfile);

export default router;
