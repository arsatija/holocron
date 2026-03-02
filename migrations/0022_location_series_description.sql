-- Add location to events
ALTER TABLE "events" ADD COLUMN "location" varchar(255);

-- Add description and location to event_series
ALTER TABLE "event_series" ADD COLUMN "description" text;
ALTER TABLE "event_series" ADD COLUMN "location" varchar(255);
