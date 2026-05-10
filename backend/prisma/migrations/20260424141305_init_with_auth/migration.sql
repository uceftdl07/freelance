-- Create users table if it doesn't exist (PostgreSQL syntax)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CANDIDAT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");

-- Create profiles_candidat table if it doesn't exist
CREATE TABLE IF NOT EXISTS "profiles_candidat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "yearsOfExperience" INTEGER,
    "availability" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "portfolioUrl" TEXT,
    "tjm" INTEGER,
    "location" TEXT,
    "phone" TEXT,
    "linkedIn" TEXT,
    "avatarUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "draftData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add constraints for profiles_candidat if they don't exist
ALTER TABLE "profiles_candidat" ADD CONSTRAINT "profiles_candidat_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_candidat_userId_key" ON "profiles_candidat"("userId");

-- Create profiles_recruteur table if it doesn't exist
CREATE TABLE IF NOT EXISTS "profiles_recruteur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add constraints for profiles_recruteur if they don't exist
ALTER TABLE "profiles_recruteur" ADD CONSTRAINT "profiles_recruteur_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_recruteur_userId_key" ON "profiles_recruteur"("userId");

-- Create experiences table if it doesn't exist
CREATE TABLE IF NOT EXISTS "experiences" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "profiles_candidat"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "experiences_profileId_idx" ON "experiences"("profileId");

-- Create educations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "educations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "field" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "educations" ADD CONSTRAINT "educations_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "profiles_candidat"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "educations_profileId_idx" ON "educations"("profileId");

-- Create remaining tables if they don't exist
CREATE TABLE IF NOT EXISTS "job_offers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruiterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "contractType" TEXT NOT NULL DEFAULT 'FREELANCE',
    "tjm" INTEGER,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3)
);

ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "saved_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruiterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "saved_candidates" ADD CONSTRAINT "saved_candidates_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "saved_candidates_recruiterId_candidateId_key"
    ON "saved_candidates"("recruiterId", "candidateId");


