-- Migration: Reverse relationship - campaign events now reference attendance
-- This makes more sense from a data modeling perspective (one event has one attendance)

-- Step 1: Add attendance_id to campaign_events table
ALTER TABLE campaign_events
ADD COLUMN IF NOT EXISTS attendance_id UUID REFERENCES attendances(id) ON DELETE CASCADE;

-- Step 2: Drop the campaign_event_id column from attendances if it exists
ALTER TABLE attendances
DROP COLUMN IF EXISTS campaign_event_id;

