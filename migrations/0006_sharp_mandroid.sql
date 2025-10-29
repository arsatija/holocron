ALTER TABLE "campaign_events" DROP CONSTRAINT "campaign_events_attendance_id_attendances_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign_events" ADD COLUMN "banner_image" text;--> statement-breakpoint
ALTER TABLE "campaign_events" ADD CONSTRAINT "campaign_events_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE set null ON UPDATE no action;