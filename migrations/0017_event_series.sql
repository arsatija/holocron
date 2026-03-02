-- Migration 0017: Add event_series table, seriesId to events, operationName to operations, plannedOperationCount to campaigns

-- 1. Add plannedOperationCount to campaigns
ALTER TABLE campaigns ADD COLUMN "planned_operation_count" integer NOT NULL DEFAULT 0;

-- 2. Create event_series table
CREATE TABLE "event_series" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(255) NOT NULL,
    "operation_type" "operationType" NOT NULL DEFAULT 'Main',
    "campaign_id" uuid REFERENCES campaigns("id") ON DELETE SET NULL,
    "day_of_week" integer NOT NULL,
    "event_time" varchar(10),
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 3. Add seriesId to events
ALTER TABLE events ADD COLUMN "series_id" uuid REFERENCES event_series("id") ON DELETE SET NULL;

-- 4. Add operationName to operations
ALTER TABLE operations ADD COLUMN "operation_name" varchar(255);
