ALTER TYPE "public"."audit_entity_type" ADD VALUE 'medic_attendance';--> statement-breakpoint
CREATE TABLE "medic_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medic_id" uuid NOT NULL,
	"element_id" uuid NOT NULL,
	"operation_type" "eventTypes" NOT NULL,
	"event_id" uuid NOT NULL,
	"submitted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medic_attendances" ADD CONSTRAINT "medic_attendances_medic_id_troopers_id_fk" FOREIGN KEY ("medic_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medic_attendances" ADD CONSTRAINT "medic_attendances_element_id_unit_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."unit_elements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medic_attendances" ADD CONSTRAINT "medic_attendances_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medic_attendances" ADD CONSTRAINT "medic_attendances_submitted_by_troopers_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;