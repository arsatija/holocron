ALTER TABLE "attendances" DROP CONSTRAINT "attendances_campaign_event_id_campaign_events_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_events" ALTER COLUMN "campaign_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD COLUMN "attendance_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" DROP COLUMN "campaign_event_id";