-- CreateTable: Quiz
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "questions" TEXT NOT NULL,
    "timeLimit" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: QuizAttempt
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQ" INTEGER NOT NULL,
    "correctQ" INTEGER NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_skill_key" ON "quizzes"("skill");
CREATE INDEX "quiz_attempts_candidateId_idx" ON "quiz_attempts"("candidateId");
CREATE INDEX "quiz_attempts_quizId_idx" ON "quiz_attempts"("quizId");

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey"
    FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
