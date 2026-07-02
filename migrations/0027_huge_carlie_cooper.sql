ALTER TYPE "public"."audit_entity_type" ADD VALUE 'medal';--> statement-breakpoint
ALTER TYPE "public"."audit_entity_type" ADD VALUE 'trooper_medal';--> statement-breakpoint
CREATE TABLE "medals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trooper_medals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trooper_id" uuid NOT NULL,
	"medal_id" uuid NOT NULL,
	"awarded_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trooper_medals" ADD CONSTRAINT "trooper_medals_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_medals" ADD CONSTRAINT "trooper_medals_medal_id_medals_id_fk" FOREIGN KEY ("medal_id") REFERENCES "public"."medals"("id") ON DELETE cascade ON UPDATE no action;