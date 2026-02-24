ALTER TABLE "attendances" ALTER COLUMN "event_type" SET DEFAULT 'Main';--> statement-breakpoint
ALTER TABLE "billets" ADD COLUMN "slug" varchar(100);--> statement-breakpoint
ALTER TABLE "department_positions" ADD COLUMN "slug" varchar(100);--> statement-breakpoint
ALTER TABLE "billets" ADD CONSTRAINT "billets_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "department_positions" ADD CONSTRAINT "department_positions_slug_unique" UNIQUE("slug");