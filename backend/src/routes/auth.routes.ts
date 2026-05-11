import { Router } from "express";
import {
  register,
  login,
  verifyEmail,
  googleLogin,
  linkedInLogin,
  resendVerification,
  changePassword,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Candidat or Recruteur)
 * @access  Public
 * @body    { email, password, role, firstName, lastName, company? }
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user's email with token
 * @access  Public
 * @query   token
 */
router.get("/verify-email", verifyEmail);

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register with Google OAuth (authorization code exchange)
 * @access  Public
 * @body    { code, role? }
 */
router.post("/google", googleLogin);

/**
 * @route   POST /api/auth/linkedin
 * @desc    Login/Register with LinkedIn OAuth (authorization code exchange)
 * @access  Public
 * @body    { code, role? }
 */
router.post("/linkedin", linkedInLogin);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 * @body    { email }
 */
router.post("/resend-verification", resendVerification);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change current authenticated user's password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put("/change-password", authMiddleware, changePassword);

export default router;
