import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getMyProfile,
  updateMyProfile,
  getMySettings,
  updateMySettings,
  getPublicProfile,
  saveDraft,
  loadDraft,
  publishProfile,
  createExperience,
  updateExperience,
  deleteExperience,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../controllers/profile.controller";

const router = Router();

/**
 * @route   GET /api/profile/me
 * @desc    Get the authenticated user's full profile
 * @access  Private (JWT required)
 */
router.get("/me", authMiddleware, getMyProfile);

/**
 * @route   PUT /api/profile/me
 * @desc    Update the authenticated user's profile
 * @access  Private (JWT required)
 * @body    Profile fields to update (depends on role)
 */
router.put("/me", authMiddleware, updateMyProfile);

/**
 * @route   GET /api/profile/settings
 * @desc    Get authenticated candidate settings
 * @access  Private (JWT required)
 */
router.get("/settings", authMiddleware, getMySettings);

/**
 * @route   PUT /api/profile/settings
 * @desc    Update authenticated candidate settings
 * @access  Private (JWT required)
 */
router.put("/settings", authMiddleware, updateMySettings);

/**
 * @route   GET /api/profile/:id
 * @desc    Get a user's public profile
 * @access  Public
 */
router.get("/:id", getPublicProfile);

/**
 * @route   PUT /api/profile/draft
 * @desc    Save profile draft
 * @access  Private (JWT required)
 */
router.put("/draft", authMiddleware, saveDraft);

/**
 * @route   GET /api/profile/draft
 * @desc    Load profile draft
 * @access  Private (JWT required)
 */
router.get("/draft", authMiddleware, loadDraft);

/**
 * @route   POST /api/profile/publish
 * @desc    Publish profile from draft
 * @access  Private (JWT required)
 */
router.post("/publish", authMiddleware, publishProfile);

/**
 * @route   POST /api/profile/experiences
 * @desc    Create a new experience
 * @access  Private (JWT required)
 */
router.post("/experiences", authMiddleware, createExperience);

/**
 * @route   PUT /api/profile/experiences/:id
 * @desc    Update an experience
 * @access  Private (JWT required)
 */
router.put("/experiences/:id", authMiddleware, updateExperience);

/**
 * @route   DELETE /api/profile/experiences/:id
 * @desc    Delete an experience
 * @access  Private (JWT required)
 */
router.delete("/experiences/:id", authMiddleware, deleteExperience);

/**
 * @route   POST /api/profile/educations
 * @desc    Create a new education entry
 * @access  Private (JWT required)
 */
router.post("/educations", authMiddleware, createEducation);

/**
 * @route   PUT /api/profile/educations/:id
 * @desc    Update an education entry
 * @access  Private (JWT required)
 */
router.put("/educations/:id", authMiddleware, updateEducation);

/**
 * @route   DELETE /api/profile/educations/:id
 * @desc    Delete an education entry
 * @access  Private (JWT required)
 */
router.delete("/educations/:id", authMiddleware, deleteEducation);

export default router;
