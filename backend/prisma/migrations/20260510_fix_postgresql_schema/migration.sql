-- Intentionally left blank.
--
-- This migration previously attempted to recreate the full schema to bridge a
-- provider mismatch introduced by an older SQLite-based migration history.
--
-- The history has since been corrected by aligning:
--   1. `schema.prisma` -> PostgreSQL
--   2. `migration_lock.toml` -> PostgreSQL
--   3. the initial migration SQL -> PostgreSQL timestamp syntax
--
-- Keeping this migration as a no-op preserves migration ordering for databases
-- where it may already be recorded, while avoiding duplicate table creation or
-- schema drift on fresh deployments.


