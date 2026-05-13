-- Community posts
CREATE TABLE IF NOT EXISTS "community_posts" (
  "id"           TEXT NOT NULL,
  "authorId"     TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "content"      TEXT NOT NULL,
  "type"         TEXT NOT NULL DEFAULT 'ARTICLE',
  "category"     TEXT NOT NULL DEFAULT 'GENERAL',
  "fileUrl"      TEXT,
  "tags"         TEXT NOT NULL DEFAULT '[]',
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "rejectReason" TEXT,
  "views"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "community_posts_status_idx" ON "community_posts"("status");
CREATE INDEX IF NOT EXISTS "community_posts_authorId_idx" ON "community_posts"("authorId");

ALTER TABLE "community_posts"
  ADD CONSTRAINT "community_posts_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Content blocks (admin-managed)
CREATE TABLE IF NOT EXISTS "content_blocks" (
  "id"        TEXT NOT NULL,
  "page"      TEXT NOT NULL,
  "title"     TEXT,
  "content"   TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT 'BANNER',
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "content_blocks_page_isVisible_idx" ON "content_blocks"("page", "isVisible");
