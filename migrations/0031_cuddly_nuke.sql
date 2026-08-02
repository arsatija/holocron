ALTER TYPE "public"."medalCriteriaType" ADD VALUE 'HasMedal';--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD COLUMN "required_medal_id" uuid;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_required_medal_id_medals_id_fk" FOREIGN KEY ("required_medal_id") REFERENCES "public"."medals"("id") ON DELETE no action ON UPDATE no action;