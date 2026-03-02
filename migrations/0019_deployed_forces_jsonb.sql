-- Step 1: add new jsonb column
ALTER TABLE "operations" ADD COLUMN "deployed_forces_new" jsonb;

-- Step 2: migrate existing text[] data to { name, optional: false } objects
UPDATE "operations"
SET "deployed_forces_new" = CASE
    WHEN deployed_forces IS NULL THEN NULL
    WHEN array_length(deployed_forces, 1) IS NULL THEN '[]'::jsonb
    ELSE (
        SELECT jsonb_agg(jsonb_build_object('name', elem, 'optional', false))
        FROM unnest(deployed_forces) AS elem
    )
END;

-- Step 3: drop old column
ALTER TABLE "operations" DROP COLUMN "deployed_forces";

-- Step 4: rename new column into place
ALTER TABLE "operations" RENAME COLUMN "deployed_forces_new" TO "deployed_forces";
