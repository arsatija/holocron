-- Migration 0016: Social as event kind, operationType cleanup, objectives to JSONB

-- 1. Add 'Social' to eventKind enum
ALTER TYPE "eventKind" ADD VALUE 'Social';

-- 2. Recreate operationType without 'Social'
--    PostgreSQL cannot remove enum values; must rename + recreate
ALTER TYPE "operationType" RENAME TO "operationType_old";
CREATE TYPE "operationType" AS ENUM ('Main', 'Skirmish', 'Fun', 'Raid', 'Joint');
-- Drop default first — the old default references the old enum type
ALTER TABLE operations ALTER COLUMN operation_type DROP DEFAULT;
ALTER TABLE operations
  ALTER COLUMN operation_type TYPE "operationType"
  USING CASE
    WHEN operation_type::text IN ('Main', 'Skirmish', 'Fun', 'Raid', 'Joint')
      THEN operation_type::text::"operationType"
    ELSE 'Main'::"operationType"
  END;
-- Restore the default using the new enum type
ALTER TABLE operations ALTER COLUMN operation_type SET DEFAULT 'Main'::"operationType";
DROP TYPE "operationType_old";

-- 3. Change objectives from text to jsonb
--    Existing text values cannot be auto-converted to the new structured format; set to NULL
ALTER TABLE operations
  ALTER COLUMN objectives TYPE jsonb
  USING NULL;
