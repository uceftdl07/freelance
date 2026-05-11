-- Create applications table
CREATE TABLE IF NOT EXISTS "applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "cvUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "applications"
    ADD CONSTRAINT "applications_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "job_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "applications"
    ADD CONSTRAINT "applications_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "applications_jobId_candidateId_key"
    ON "applications"("jobId", "candidateId");

CREATE INDEX IF NOT EXISTS "applications_candidateId_idx"
    ON "applications"("candidateId");

CREATE INDEX IF NOT EXISTS "applications_jobId_idx"
    ON "applications"("jobId");

