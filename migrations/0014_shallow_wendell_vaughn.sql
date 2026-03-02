ALTER TYPE "public"."eventTypes" ADD VALUE 'Training';--> statement-breakpoint
ALTER TABLE "campaign_events" DROP CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_events" ADD COLUMN "qualification_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD COLUMN "scheduled_trainer_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD COLUMN "training_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD COLUMN "google_calendar_event_id" text;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_scheduled_trainer_id_troopers_id_fk" FOREIGN KEY ("scheduled_trainer_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;