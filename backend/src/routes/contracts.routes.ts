import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createContract, contractUploadMiddleware,
  getMyContracts, getContract,
  cancelContract, docuSealWebhook,
} from "../controllers/contracts.controller";

const router = Router();

// DocuSeal webhook — no auth, must be before authMiddleware
router.post("/webhook", docuSealWebhook);

// All other routes require auth
router.use(authMiddleware);

router.post("/", contractUploadMiddleware, createContract);
router.get("/mine", getMyContracts);
router.get("/:id", getContract);
router.patch("/:id/cancel", cancelContract);

export default router;
