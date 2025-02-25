CREATE TYPE "public"."eventTypes" AS ENUM('Main', 'Skirmish', 'Fun', 'Raid', 'Joint');--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "event_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trainings" ALTER COLUMN "training_notes" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "event_notes" text DEFAULT '';