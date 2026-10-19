CREATE TYPE "public"."announcement_category" AS ENUM('News', 'Announcement');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."audit_entity_type" AS ENUM('trooper', 'trooper_rank', 'trooper_qualification', 'trooper_bio', 'attendance', 'trooper_attendance', 'training_completion', 'billet_assignment', 'department_assignment', 'campaign', 'event', 'operation', 'announcement', 'event_series', 'rank', 'department', 'department_position', 'unit_element', 'billet', 'medal', 'trooper_medal');--> statement-breakpoint
CREATE TYPE "public"."bio_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."eventKind" AS ENUM('Operation', 'Training', 'Meeting', 'Social');--> statement-breakpoint
CREATE TYPE "public"."eventTypes" AS ENUM('Main', 'Skirmish', 'Fun', 'Raid', 'Joint', 'Training');--> statement-breakpoint
CREATE TYPE "public"."medalCriteriaType" AS ENUM('Qualification', 'ZeusCount', 'ReferralCount', 'TrainingCompletionCount', 'AttendanceCount', 'TenureDays', 'HasMedal');--> statement-breakpoint
CREATE TYPE "public"."operationType" AS ENUM('Main', 'Skirmish', 'Fun', 'Raid', 'Joint');--> statement-breakpoint
CREATE TYPE "public"."qualification_category" AS ENUM('Standard', 'Medical', 'Advanced', 'Aviation', 'Detachments', 'Leadership', 'Zeus');--> statement-breakpoint
CREATE TYPE "public"."rankLevel" AS ENUM('Enlisted', 'JNCO', 'SNCO', 'Company', 'Command');--> statement-breakpoint
CREATE TYPE "public"."scopes" AS ENUM('Admin', 'Recruitment', 'Training', 'Attendance', 'Roster', 'Qualifications', 'Mod', 'SGD');--> statement-breakpoint
CREATE TYPE "public"."series_cadence" AS ENUM('Daily', 'Weekly', 'Biweekly', 'Monthly');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('Active', 'Inactive', 'Discharged', 'Retired');--> statement-breakpoint
CREATE TYPE "public"."zeusRole" AS ENUM('Zeus', 'CoZeus', 'Either');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"category" "announcement_category" DEFAULT 'Announcement' NOT NULL,
	"is_important" boolean DEFAULT false NOT NULL,
	"author_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zeus_id" uuid,
	"co_zeus_ids" uuid[],
	"event_date" date DEFAULT now() NOT NULL,
	"event_type" "eventTypes" DEFAULT 'Main' NOT NULL,
	"event_notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" "audit_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"entity_label" text,
	"target_trooper_id" uuid,
	"previous_data" jsonb,
	"new_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billet_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billet_id" uuid NOT NULL,
	"trooper_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "billet_assignments_billet_id_unique" UNIQUE("billet_id"),
	CONSTRAINT "billet_assignments_trooper_id_unique" UNIQUE("trooper_id")
);
--> statement-breakpoint
CREATE TABLE "billets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" varchar(100) DEFAULT 'Trooper' NOT NULL,
	"slug" varchar(100),
	"unit_element_id" uuid,
	"superior_billet_id" uuid,
	"priority" integer DEFAULT -1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"story" text,
	"start_date" date DEFAULT now() NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"planned_operation_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_position_id" uuid NOT NULL,
	"trooper_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" varchar(255) NOT NULL,
	"slug" varchar(100),
	"department_id" uuid NOT NULL,
	"superior_position_id" uuid,
	"priority" integer DEFAULT -1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(255) DEFAULT '/images/9_logo.png' NOT NULL,
	"parent_id" uuid,
	"priority" integer DEFAULT -1 NOT NULL,
	"departmentScopes" "scopes"[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"event_kind" "eventKind" DEFAULT 'Operation' NOT NULL,
	"operation_type" "operationType",
	"cadence" "series_cadence" DEFAULT 'Weekly' NOT NULL,
	"start_date" date,
	"campaign_id" uuid,
	"description" text,
	"location" varchar(255),
	"day_of_week" integer NOT NULL,
	"event_time" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"series_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '',
	"event_date" date DEFAULT now() NOT NULL,
	"event_time" varchar(10),
	"event_end_time" varchar(10),
	"event_kind" "eventKind" NOT NULL,
	"location" varchar(255),
	"google_calendar_event_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"trooper_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
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
CREATE TABLE "medals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(255) NOT NULL,
	"auto_award_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"operation_type" "operationType" DEFAULT 'Main' NOT NULL,
	"operation_name" varchar(255),
	"transmitted_by_id" uuid,
	"deployed_forces" jsonb,
	"objectives" jsonb,
	"situation_report" text,
	"event_notes" text,
	"attendance_id" uuid,
	"phase_id" uuid,
	"enemy_kills" integer DEFAULT 0 NOT NULL,
	"friendly_deaths" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operations_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"abbreviation" char(4) NOT NULL,
	"category" "qualification_category" DEFAULT 'Standard' NOT NULL,
	"rank_requirement" varchar(50) DEFAULT 'CT' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranks" (
	"id" serial PRIMARY KEY NOT NULL,
	"grade" varchar(10),
	"name" varchar(100),
	"abbreviation" varchar(10),
	"rankLevel" "rankLevel" DEFAULT 'Enlisted' NOT NULL,
	"next_rank_id" integer,
	"order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "training_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"trainee_ids" uuid[] DEFAULT '{}' NOT NULL,
	"qualification_id" uuid NOT NULL,
	"training_date" date DEFAULT now() NOT NULL,
	"training_notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"qualification_id" uuid,
	"scheduled_trainer_id" uuid,
	"training_completion_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trainings_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "trooper_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trooper_id" uuid NOT NULL,
	"attendance_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trooper_bios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trooper_id" uuid NOT NULL,
	"content" text NOT NULL,
	"previous_content" text,
	"submitted_by_id" uuid,
	"approved_by_id" uuid,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"status" "bio_status" DEFAULT 'pending' NOT NULL
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
CREATE TABLE "trooper_qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trooper_id" uuid NOT NULL,
	"qualification_id" uuid NOT NULL,
	"earned_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "troopers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "status" DEFAULT 'Active' NOT NULL,
	"rank" integer DEFAULT 24 NOT NULL,
	"numbers" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"referred_by" uuid,
	"recruited_by" uuid,
	"referral_method" varchar(50),
	"recruitment_date" date DEFAULT now() NOT NULL,
	"rank_changed_date" date,
	"bio" text,
	"attendances" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "number_check" CHECK (("troopers"."numbers" >= 1000 AND "troopers"."numbers" <= 9999))
);
--> statement-breakpoint
CREATE TABLE "unit_elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(255) DEFAULT '/images/9_logo.png' NOT NULL,
	"parent_id" uuid,
	"priority" integer DEFAULT -1 NOT NULL,
	"radio" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"trooper_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_troopers_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_zeus_id_troopers_id_fk" FOREIGN KEY ("zeus_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_troopers_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_trooper_id_troopers_id_fk" FOREIGN KEY ("target_trooper_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billet_assignments" ADD CONSTRAINT "billet_assignments_billet_id_billets_id_fk" FOREIGN KEY ("billet_id") REFERENCES "public"."billets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billet_assignments" ADD CONSTRAINT "billet_assignments_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billets" ADD CONSTRAINT "billets_unit_element_id_unit_elements_id_fk" FOREIGN KEY ("unit_element_id") REFERENCES "public"."unit_elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_phases" ADD CONSTRAINT "campaign_phases_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_department_position_id_department_positions_id_fk" FOREIGN KEY ("department_position_id") REFERENCES "public"."department_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_positions" ADD CONSTRAINT "department_positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_series_id_event_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_medal_id_medals_id_fk" FOREIGN KEY ("medal_id") REFERENCES "public"."medals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medal_criteria" ADD CONSTRAINT "medal_criteria_required_medal_id_medals_id_fk" FOREIGN KEY ("required_medal_id") REFERENCES "public"."medals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_transmitted_by_id_troopers_id_fk" FOREIGN KEY ("transmitted_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations" ADD CONSTRAINT "operations_phase_id_campaign_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."campaign_phases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_next_rank_fkey" FOREIGN KEY ("next_rank_id") REFERENCES "public"."ranks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_logs" ADD CONSTRAINT "recruitment_logs_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_logs" ADD CONSTRAINT "recruitment_logs_recruited_by_id_troopers_id_fk" FOREIGN KEY ("recruited_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_logs" ADD CONSTRAINT "recruitment_logs_referred_by_id_troopers_id_fk" FOREIGN KEY ("referred_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_trainer_id_troopers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_scheduled_trainer_id_troopers_id_fk" FOREIGN KEY ("scheduled_trainer_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_training_completion_id_training_completions_id_fk" FOREIGN KEY ("training_completion_id") REFERENCES "public"."training_completions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_attendances" ADD CONSTRAINT "trooper_attendances_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_attendances" ADD CONSTRAINT "trooper_attendances_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_bios" ADD CONSTRAINT "trooper_bios_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_bios" ADD CONSTRAINT "trooper_bios_submitted_by_id_troopers_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_bios" ADD CONSTRAINT "trooper_bios_approved_by_id_troopers_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."troopers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_medals" ADD CONSTRAINT "trooper_medals_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_medals" ADD CONSTRAINT "trooper_medals_medal_id_medals_id_fk" FOREIGN KEY ("medal_id") REFERENCES "public"."medals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_qualifications" ADD CONSTRAINT "trooper_qualifications_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_qualifications" ADD CONSTRAINT "trooper_qualifications_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "troopers" ADD CONSTRAINT "troopers_rank_ranks_id_fk" FOREIGN KEY ("rank") REFERENCES "public"."ranks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;