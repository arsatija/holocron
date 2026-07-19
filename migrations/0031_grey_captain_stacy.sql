ALTER TABLE "wiki_pages" ADD COLUMN "draft_title" varchar(500);--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "draft_content" text;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "draft_saved_at" timestamp;