import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getMyProfile,
  updateMyProfile,
  getMySettings,
  updateMySettings,
  getPublicProfile,
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

export default router;
