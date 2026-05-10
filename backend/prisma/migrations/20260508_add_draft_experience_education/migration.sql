-- Add draftData and status columns to profiles_candidat
ALTER TABLE "profiles_candidat" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "profiles_candidat" ADD COLUMN "draftData" TEXT;
ALTER TABLE "profiles_candidat" ADD COLUMN "email" TEXT;

-- Create Experience table
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "currentlyWorking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles_candidat" ("id") ON DELETE CASCADE
);

-- Create Education table
CREATE TABLE "educations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "field" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "educations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles_candidat" ("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX "experiences_profileId_idx" ON "experiences"("profileId");
CREATE INDEX "educations_profileId_idx" ON "educations"("profileId");

