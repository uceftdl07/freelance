import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createReview, getUserReviews, canReview } from "../controllers/reviews.controller";

const router = Router();

router.post("/", authMiddleware, createReview);
router.get("/user/:userId", getUserReviews); // public — visible sur les profils
router.get("/can-review/:applicationId", authMiddleware, canReview);

export default router;
