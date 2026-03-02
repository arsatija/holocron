-- Events Architecture Redesign
-- Separates campaign_events (fat table) into events + operations + trainings (hub-and-spoke)
-- Renames old trainings (completion records) to training_completions

-- 0. Rename existing trainings table before creating new one with that name
ALTER TABLE trainings RENAME TO training_completions;

-- 1. New enums
CREATE TYPE "eventKind" AS ENUM ('Operation', 'Training', 'Meeting');
CREATE TYPE "operationType" AS ENUM ('Main', 'Skirmish', 'Fun', 'Raid', 'Joint', 'Social');

-- 2. Rename table (preserves all IDs so external refs still work)
ALTER TABLE campaign_events RENAME TO events;

-- 3. Add eventKind column, backfill from eventType
ALTER TABLE events ADD COLUMN event_kind "eventKind";
UPDATE events SET event_kind = 'Training' WHERE event_type = 'Training';
UPDATE events SET event_kind = 'Operation' WHERE event_type != 'Training';
ALTER TABLE events ALTER COLUMN event_kind SET NOT NULL;

-- 4. Create operations table
CREATE TABLE operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  operation_type "operationType" NOT NULL DEFAULT 'Main',
  transmitted_by_id UUID REFERENCES troopers(id) ON DELETE SET NULL,
  co_transmitter_ids UUID[],
  deployed_forces TEXT[],
  objectives TEXT,
  situation_report TEXT,
  event_notes TEXT,
  attendance_id UUID REFERENCES attendances(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. Migrate operation rows into operations table
INSERT INTO operations (event_id, operation_type, transmitted_by_id, co_transmitter_ids,
  event_notes, attendance_id, created_at, updated_at)
SELECT id,
  CASE event_type::text
    WHEN 'Main' THEN 'Main'::"operationType"
    WHEN 'Skirmish' THEN 'Skirmish'::"operationType"
    WHEN 'Fun' THEN 'Fun'::"operationType"
    WHEN 'Raid' THEN 'Raid'::"operationType"
    WHEN 'Joint' THEN 'Joint'::"operationType"
    ELSE 'Main'::"operationType"
  END,
  zeus_id, co_zeus_ids, event_notes, attendance_id, created_at, updated_at
FROM events WHERE event_kind = 'Operation';

-- 6. Create trainings table (scheduled training events — child of events)
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  qualification_id UUID REFERENCES qualifications(id) ON DELETE SET NULL,
  scheduled_trainer_id UUID REFERENCES troopers(id) ON DELETE SET NULL,
  training_completion_id UUID REFERENCES training_completions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 7. Migrate training rows into trainings table
INSERT INTO trainings (event_id, qualification_id, scheduled_trainer_id,
  training_completion_id, created_at, updated_at)
SELECT id, qualification_id, scheduled_trainer_id,
  training_id,  -- was referencing old trainings table, now training_completions
  created_at, updated_at
FROM events WHERE event_kind = 'Training';

-- 8. Drop migrated columns from events
ALTER TABLE events
  DROP COLUMN event_type,
  DROP COLUMN zeus_id,
  DROP COLUMN co_zeus_ids,
  DROP COLUMN event_notes,
  DROP COLUMN qualification_id,
  DROP COLUMN scheduled_trainer_id,
  DROP COLUMN training_id,
  DROP COLUMN is_completed,
  DROP COLUMN attendance_id;
