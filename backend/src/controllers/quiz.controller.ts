import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type QuestionRaw = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function parseQuestions(raw: string): QuestionRaw[] {
  try { return JSON.parse(raw) as QuestionRaw[]; } catch { return []; }
}

/** Strip correct answers before sending to client */
function sanitizeQuestions(questions: QuestionRaw[]) {
  return questions.map(({ id, text, options }) => ({ id, text, options }));
}

// ─── List available quizzes ───────────────────────────────────────────────────

export async function listQuizzes(req: Request, res: Response): Promise<void> {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      select: { id: true, skill: true, title: true, description: true, difficulty: true, timeLimit: true },
      orderBy: { skill: "asc" },
    });
    res.json({ success: true, data: quizzes });
  } catch (e) {
    console.error("[QUIZ] listQuizzes:", e);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Get quiz questions (no correct answers) ─────────────────────────────────

export async function getQuiz(req: Request, res: Response): Promise<void> {
  try {
    const skill = String(req.params.skill);
    const quiz = await prisma.quiz.findUnique({
      where: { skill },
    });
    if (!quiz || !quiz.isActive) {
      res.status(404).json({ success: false, message: "Quiz non trouvé." });
      return;
    }
    const questions = parseQuestions(quiz.questions);
    res.json({
      success: true,
      data: {
        id: quiz.id,
        skill: quiz.skill,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        timeLimit: quiz.timeLimit,
        questions: sanitizeQuestions(questions),
        totalQuestions: questions.length,
      },
    });
  } catch (e) {
    console.error("[QUIZ] getQuiz:", e);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Submit answers & get score ───────────────────────────────────────────────

export async function submitQuiz(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.user?.userId;
    if (!candidateId) {
      res.status(401).json({ success: false, message: "Non authentifié." });
      return;
    }

    const quiz = await prisma.quiz.findUnique({ where: { skill: String(req.params.skill) } });
    if (!quiz || !quiz.isActive) {
      res.status(404).json({ success: false, message: "Quiz non trouvé." });
      return;
    }

    const { answers } = req.body as { answers: Record<string, number> };
    if (!answers || typeof answers !== "object") {
      res.status(400).json({ success: false, message: "Réponses manquantes." });
      return;
    }

    const questions = parseQuestions(quiz.questions);
    let correctQ = 0;
    const results = questions.map((q) => {
      const selected = answers[q.id] ?? -1;
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correctQ++;
      return {
        id: q.id,
        text: q.text,
        options: q.options,
        selectedIndex: selected,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQ = questions.length;
    const score = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

    // Save attempt (keep best score only)
    const existing = await prisma.quizAttempt.findFirst({
      where: { quizId: quiz.id, candidateId },
      orderBy: { score: "desc" },
    });

    let attempt;
    if (existing && existing.score >= score) {
      attempt = existing;
    } else {
      attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          candidateId,
          score,
          totalQ,
          correctQ,
          answers: JSON.stringify(answers),
        },
      });
    }

    res.json({
      success: true,
      data: {
        score,
        totalQ,
        correctQ,
        attemptId: attempt.id,
        results,
      },
    });
  } catch (e) {
    console.error("[QUIZ] submitQuiz:", e);
    res.status(500).json({ success: false, message: "Erreur lors de la soumission." });
  }
}

// ─── Get my scores (candidat) ─────────────────────────────────────────────────

export async function getMyScores(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = req.user?.userId;
    if (!candidateId) {
      res.status(401).json({ success: false, message: "Non authentifié." });
      return;
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { candidateId },
      include: { quiz: { select: { skill: true, title: true, difficulty: true } } },
      orderBy: { completedAt: "desc" },
    });

    type AttemptWithQuiz = (typeof attempts)[0] & { quiz: { skill: string; title: string; difficulty: string } };

    // Keep best score per quiz
    const bestByQuiz = new Map<string, AttemptWithQuiz>();
    for (const a of attempts as AttemptWithQuiz[]) {
      const existing = bestByQuiz.get(a.quizId);
      if (!existing || a.score > existing.score) bestByQuiz.set(a.quizId, a);
    }

    const scores = Array.from(bestByQuiz.values()).map((a) => ({
      quizId: a.quizId,
      skill: a.quiz.skill,
      title: a.quiz.title,
      difficulty: a.quiz.difficulty,
      score: a.score,
      totalQ: a.totalQ,
      correctQ: a.correctQ,
      completedAt: a.completedAt,
    }));

    res.json({ success: true, data: scores });
  } catch (e) {
    console.error("[QUIZ] getMyScores:", e);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}

// ─── Get candidate scores (recruteur view) ────────────────────────────────────

export async function getCandidateScores(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = String(req.params.candidateId);

    const attempts = await prisma.quizAttempt.findMany({
      where: { candidateId },
      include: { quiz: { select: { skill: true, title: true, difficulty: true } } },
      orderBy: { completedAt: "desc" },
    });

    type AttemptWithQuizR = (typeof attempts)[0] & { quiz: { skill: string; title: string; difficulty: string } };
    const bestByQuiz = new Map<string, AttemptWithQuizR>();
    for (const a of attempts as AttemptWithQuizR[]) {
      const existing = bestByQuiz.get(a.quizId);
      if (!existing || a.score > existing.score) bestByQuiz.set(a.quizId, a);
    }

    const scores = Array.from(bestByQuiz.values()).map((a) => ({
      skill: a.quiz.skill,
      title: a.quiz.title,
      difficulty: a.quiz.difficulty,
      score: a.score,
      totalQ: a.totalQ,
      completedAt: a.completedAt,
    }));

    res.json({ success: true, data: scores });
  } catch (e) {
    console.error("[QUIZ] getCandidateScores:", e);
    res.status(500).json({ success: false, message: "Erreur." });
  }
}
