-- Add requiredQuizzes column to job_offers
ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS "requiredQuizzes" TEXT NOT NULL DEFAULT '[]';
