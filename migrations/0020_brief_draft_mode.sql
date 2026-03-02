-- Add is_published to operations; default false for new briefs
ALTER TABLE "operations" ADD COLUMN "is_published" boolean NOT NULL DEFAULT false;

-- Existing briefs were previously always visible — publish them all
UPDATE "operations" SET "is_published" = true;
