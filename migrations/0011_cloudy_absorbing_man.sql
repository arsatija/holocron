CREATE TYPE "public"."announcement_category" AS ENUM('News', 'Announcement');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"category" "announcement_category" DEFAULT 'Announcement' NOT NULL,
	"is_important" boolean DEFAULT false NOT NULL,
	"author_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_troopers_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;