ALTER TABLE "trainings" RENAME TO "training_completions";

CREATE TYPE "public"."eventKind" AS ENUM('Operation', 'Training', 'Meeting', 'Social');--> statement-breakpoint
CREATE TYPE "public"."operationType" AS ENUM('Main', 'Skirmish', 'Fun', 'Raid', 'Joint');--> statement-breakpoint
CREATE TYPE "public"."series_cadence" AS ENUM('Daily', 'Weekly', 'Biweekly', 'Monthly');--> statement-breakpoint
ALTER TYPE "public"."eventTypes" ADD VALUE IF NOT EXISTS 'Training';--> statement-breakpoint
CREATE TABLE "campaign_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_kind" "eventKind" DEFAULT 'Operation' NOT NULL,
	"operation_type" "operationType",
	"cadence" "series_cadence" DEFAULT 'Weekly' NOT NULL,
	"start_date" date,
	"campaign_id" uuid,
	"description" text,
	"location" varchar(255),
	"day_of_week" integer NOT NULL,
	"event_time" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"series_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"banner_image" text,
	"event_date" date DEFAULT now() NOT NULL,
	"event_time" varchar(10),
	"event_end_time" varchar(10),
	"event_kind" "eventKind" NOT NULL,
	"location" varchar(255),
	"google_calendar_event_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"operation_type" "operationType" DEFAULT 'Main' NOT NULL,
	"operation_name" varchar(255),
	"transmitted_by_id" uuid,
	"co_transmitter_ids" uuid[],
	"deployed_forces" jsonb,
	"objectives" jsonb,
	"situation_report" text,
	"event_notes" text,
	"attendance_id" uuid,
	"phase_id" uuid,
	"enemy_kills" integer DEFAULT 0 NOT NULL,
	"friendly_deaths" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operations_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"qualification_id" uuid,
	"scheduled_trainer_id" uuid,
	"training_completion_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trainings_event_id_unique" UNIQUE("event_id")
);

--> statement-breakpoint
ALTER TABLE "campaign_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "campaign_events" CASCADE;--> statement-breakpoint
ALTER TABLE "training_completions" DROP CONSTRAINT "trainings_trainer_id_troopers_id_fk";
--> statement-breakpoint
ALTER TABLE "training_completions" DROP CONSTRAINT "trainings_qualification_id_qualifications_id_fk";
--> statement-breakpoint
ALTER TABLE "training_completions" ALTER COLUMN "qualification_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "story" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "planned_operation_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_phases" ADD CONSTRAINT "campaign_phases_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_series_id_event_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_transmitted_by_id_troopers_id_fk" FOREIGN KEY ("transmitted_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_phase_id_campaign_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."campaign_phases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_trainer_id_troopers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_scheduled_trainer_id_troopers_id_fk" FOREIGN KEY ("scheduled_trainer_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_training_completion_id_training_completions_id_fk" FOREIGN KEY ("training_completion_id") REFERENCES "public"."training_completions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE set null ON UPDATE no action;
