ALTER TABLE "wiki_pages" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "pinned_at" timestamp;