CREATE TABLE IF NOT EXISTS "missions" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "contractId"  TEXT NOT NULL UNIQUE,
  "title"       TEXT NOT NULL,
  "recruiterId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "tjm"         INTEGER,
  "startDate"   TIMESTAMP(3),
  "endDate"     TIMESTAMP(3),
  "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "missions_contractId_fkey"  FOREIGN KEY ("contractId")  REFERENCES "contracts"("id") ON DELETE CASCADE,
  CONSTRAINT "missions_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "users"("id"),
  CONSTRAINT "missions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "missions_recruiterId_idx" ON "missions"("recruiterId");
CREATE INDEX IF NOT EXISTS "missions_candidateId_idx" ON "missions"("candidateId");

CREATE TABLE IF NOT EXISTS "timesheets" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "missionId"     TEXT NOT NULL,
  "weekStart"     TIMESTAMP(3) NOT NULL,
  "daysWorked"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description"   TEXT,
  "status"        TEXT NOT NULL DEFAULT 'DRAFT',
  "rejectionNote" TEXT,
  "submittedAt"   TIMESTAMP(3),
  "validatedAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "timesheets_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE,
  CONSTRAINT "timesheets_missionId_weekStart_key" UNIQUE ("missionId", "weekStart")
);

CREATE INDEX IF NOT EXISTS "timesheets_missionId_idx" ON "timesheets"("missionId");
