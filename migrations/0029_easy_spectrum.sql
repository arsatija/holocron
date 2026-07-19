ALTER TYPE "public"."audit_entity_type" ADD VALUE 'wiki_collection';--> statement-breakpoint
ALTER TYPE "public"."audit_entity_type" ADD VALUE 'wiki_page';--> statement-breakpoint
CREATE TABLE "wiki_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"icon" varchar(64),
	"order" integer DEFAULT 0 NOT NULL,
	"read_permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"edit_permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "wiki_page_links" (
	"source_page_id" uuid NOT NULL,
	"target_page_id" uuid NOT NULL,
	CONSTRAINT "wiki_page_links_source_page_id_target_page_id_pk" PRIMARY KEY("source_page_id","target_page_id")
);
--> statement-breakpoint
CREATE TABLE "wiki_page_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"edited_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_page_stars" (
	"page_id" uuid NOT NULL,
	"trooper_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_page_stars_page_id_trooper_id_pk" PRIMARY KEY("page_id","trooper_id")
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"parent_page_id" uuid,
	"title" varchar(500) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"content_text" text DEFAULT '' NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("content_text", '')), 'B')) STORED,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"last_edited_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wiki_collections" ADD CONSTRAINT "wiki_collections_created_by_troopers_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_links" ADD CONSTRAINT "wiki_page_links_source_page_id_wiki_pages_id_fk" FOREIGN KEY ("source_page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_links" ADD CONSTRAINT "wiki_page_links_target_page_id_wiki_pages_id_fk" FOREIGN KEY ("target_page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_revisions" ADD CONSTRAINT "wiki_page_revisions_page_id_wiki_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_revisions" ADD CONSTRAINT "wiki_page_revisions_edited_by_troopers_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_stars" ADD CONSTRAINT "wiki_page_stars_page_id_wiki_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_page_stars" ADD CONSTRAINT "wiki_page_stars_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_collection_id_wiki_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."wiki_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_parent_page_id_wiki_pages_id_fk" FOREIGN KEY ("parent_page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_created_by_troopers_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_last_edited_by_troopers_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wiki_page_revisions_page_idx" ON "wiki_page_revisions" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "wiki_pages_collection_idx" ON "wiki_pages" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "wiki_pages_parent_idx" ON "wiki_pages" USING btree ("parent_page_id");--> statement-breakpoint
CREATE INDEX "wiki_pages_search_idx" ON "wiki_pages" USING gin ("search_vector");