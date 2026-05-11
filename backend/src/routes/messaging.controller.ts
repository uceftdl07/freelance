import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getConversations,
  getMessages,
  sendMessageToConversation,
  sendMessageToUser
} from "../controllers/messaging.controller";

const router = Router();

router.get("/conversations", authMiddleware, getConversations);
router.get("/conversations/:id/messages", authMiddleware, getMessages);
router.post("/conversations/:id/messages", authMiddleware, sendMessageToConversation);
router.post("/messages", authMiddleware, sendMessageToUser);

export default router;
