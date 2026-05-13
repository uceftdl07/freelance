CREATE TABLE IF NOT EXISTS "contracts" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "applicationId"     TEXT NOT NULL UNIQUE,
  "recruiterId"       TEXT NOT NULL,
  "candidateId"       TEXT NOT NULL,
  "title"             TEXT NOT NULL,
  "tjm"               INTEGER,
  "startDate"         TIMESTAMP(3),
  "duration"          TEXT,
  "clauses"           TEXT,
  "status"            TEXT NOT NULL DEFAULT 'PENDING',
  "recruiterSignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "candidateSignedAt" TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contracts_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE,
  CONSTRAINT "contracts_recruiterId_fkey"   FOREIGN KEY ("recruiterId")   REFERENCES "users"("id"),
  CONSTRAINT "contracts_candidateId_fkey"   FOREIGN KEY ("candidateId")   REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "contracts_recruiterId_idx" ON "contracts"("recruiterId");
CREATE INDEX IF NOT EXISTS "contracts_candidateId_idx" ON "contracts"("candidateId");
