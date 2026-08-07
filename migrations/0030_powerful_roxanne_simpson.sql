CREATE TYPE "public"."medalCriteriaType" AS ENUM('Qualification', 'ZeusCount', 'ReferralCount', 'TrainingCompletionCount', 'AttendanceCount', 'TenureDays', 'HasMedal');--> statement-breakpoint
CREATE TYPE "public"."zeusRole" AS ENUM('Zeus', 'CoZeus', 'Either');--> statement-breakpoint
CREATE TABLE "medal_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medal_id" uuid NOT NULL,
	"criteria_type" "medalCriteriaType" NOT NULL,
	"qualification_id" uuid,
	"required_medal_id" uuid,
	"threshold" integer,
	"zeus_role" "zeusRole" DEFAULT 'Either',
	"event_type" "eventTypes",
	"rule_group" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medals" ADD COLUMN "auto_award_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_medal_id_medals_id_fk" FOREIGN KEY ("medal_id") REFERENCES "public"."medals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_required_medal_id_medals_id_fk" FOREIGN KEY ("required_medal_id") REFERENCES "public"."medals"("id") ON DELETE no action ON UPDATE no action;