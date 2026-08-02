CREATE TYPE "public"."zeusRole" AS ENUM('Zeus', 'CoZeus', 'Either');--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD COLUMN "zeus_role" "zeusRole" DEFAULT 'Either';--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD COLUMN "event_type" "eventTypes";--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD COLUMN "rule_group" integer DEFAULT 1 NOT NULL;