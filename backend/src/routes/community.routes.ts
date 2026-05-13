import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { listPosts, getPost, createPost, deletePost, getMyPosts } from "../controllers/community.controller";

const router = Router();

router.get("/", listPosts);                                    // public
router.get("/my-posts", authMiddleware, getMyPosts);           // auth
router.get("/:id", getPost);                                   // public
router.post("/", authMiddleware, createPost);                  // auth
router.delete("/:id", authMiddleware, deletePost);             // auth (owner)

export default router;
