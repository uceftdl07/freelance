import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { listQuizzes, getQuiz, submitQuiz, getMyScores, getCandidateScores } from "../controllers/quiz.controller";

const router = Router();

// Public — list + get questions (no answers)
router.get("/", listQuizzes);
router.get("/:skill", getQuiz);

// Candidat — submit + my scores
router.post("/:skill/submit", authMiddleware, submitQuiz);
router.get("/me/scores", authMiddleware, getMyScores);

// Recruteur or public — scores by candidateId
router.get("/candidate/:candidateId/scores", getCandidateScores);

export default router;
