import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  getStats, listUsers, updateUser, deleteUser,
  listPendingPosts, moderatePost,
  listBlocks, createBlock, updateBlock, deleteBlock,
  getPublicBlocks,
} from "../controllers/admin.controller";

const router = Router();

// Public — content blocks for a page
router.get("/blocks/:page", getPublicBlocks);

// All admin routes require ADMIN role
router.use(authMiddleware, requireRole("ADMIN"));

router.get("/stats", getStats);

router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/community", listPendingPosts);
router.patch("/community/:id/moderate", moderatePost);

router.get("/blocks", listBlocks);
router.post("/blocks", createBlock);
router.patch("/blocks/:id", updateBlock);
router.delete("/blocks/:id", deleteBlock);

export default router;
