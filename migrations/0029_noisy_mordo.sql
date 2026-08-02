CREATE TYPE "public"."medalCriteriaType" AS ENUM('Qualification', 'ZeusCount', 'ReferralCount', 'TrainingCompletionCount', 'AttendanceCount', 'TenureDays');--> statement-breakpoint
CREATE TABLE "medal_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medal_id" uuid NOT NULL,
	"criteria_type" "medalCriteriaType" NOT NULL,
	"qualification_id" uuid,
	"threshold" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_medal_id_medals_id_fk" FOREIGN KEY ("medal_id") REFERENCES "public"."medals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;