CREATE TABLE "wiki_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar NOT NULL,
	"content" json,
	"authors" uuid[],
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_authors_troopers_id_fk" FOREIGN KEY ("authors") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_verified_by_troopers_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;