CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."audit_entity_type" AS ENUM('trooper', 'trooper_rank', 'trooper_qualification', 'trooper_bio', 'attendance', 'trooper_attendance', 'training_completion', 'billet_assignment', 'department_assignment', 'campaign', 'event', 'operation', 'announcement', 'event_series');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" "audit_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"target_trooper_id" uuid,
	"previous_data" jsonb,
	"new_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_troopers_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_trooper_id_troopers_id_fk" FOREIGN KEY ("target_trooper_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;