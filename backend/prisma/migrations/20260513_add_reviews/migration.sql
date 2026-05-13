-- Add ADMIN role support (no schema change needed — role is a plain String)
-- Add reviews table for bidirectional reputation system

CREATE TABLE IF NOT EXISTS "reviews" (
  "id"            TEXT NOT NULL,
  "fromUserId"    TEXT NOT NULL,
  "toUserId"      TEXT NOT NULL,
  "applicationId" TEXT,
  "rating"        INTEGER NOT NULL,
  "comment"       TEXT,
  "type"          TEXT NOT NULL,
  "badges"        TEXT NOT NULL DEFAULT '[]',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- Unique: one review per (fromUser, application)
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_fromUserId_applicationId_key"
  ON "reviews"("fromUserId", "applicationId");

CREATE INDEX IF NOT EXISTS "reviews_toUserId_idx"
  ON "reviews"("toUserId");

-- Foreign keys
ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
