ALTER TABLE "campaign_event_attendances" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "campaign_event_attendances" CASCADE;--> statement-breakpoint
ALTER TABLE "attendances" ADD COLUMN "campaign_event_id" uuid;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_campaign_event_id_campaign_events_id_fk" FOREIGN KEY ("campaign_event_id") REFERENCES "public"."campaign_events"("id") ON DELETE no action ON UPDATE no action;