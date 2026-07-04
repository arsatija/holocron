CREATE TABLE "recruitment_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trooper_id" uuid NOT NULL,
	"recruited_by_id" uuid,
	"referred_by_id" uuid,
	"referral_method" varchar(50),
	"age_confirmed" boolean DEFAULT false NOT NULL,
	"microphone_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "troopers" ADD COLUMN "referral_method" varchar(50);--> statement-breakpoint
ALTER TABLE "recruitment_logs" ADD CONSTRAINT "recruitment_logs_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_logs" ADD CONSTRAINT "recruitment_logs_recruited_by_id_troopers_id_fk" FOREIGN KEY ("recruited_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_logs" ADD CONSTRAINT "recruitment_logs_referred_by_id_troopers_id_fk" FOREIGN KEY ("referred_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;