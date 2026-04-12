CREATE TYPE "public"."bio_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "trooper_bios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trooper_id" uuid NOT NULL,
	"content" text NOT NULL,
	"previous_content" text,
	"submitted_by_id" uuid,
	"approved_by_id" uuid,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"status" "bio_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trooper_bios" ADD CONSTRAINT "trooper_bios_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_bios" ADD CONSTRAINT "trooper_bios_submitted_by_id_troopers_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_bios" ADD CONSTRAINT "trooper_bios_approved_by_id_troopers_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;