import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createContract, getMyContracts, getContract,
  signContract, refuseContract, cancelContract,
} from "../controllers/contracts.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createContract);
router.get("/mine", getMyContracts);
router.get("/:id", getContract);
router.patch("/:id/sign", signContract);
router.patch("/:id/refuse", refuseContract);
router.patch("/:id/cancel", cancelContract);

export default router;
