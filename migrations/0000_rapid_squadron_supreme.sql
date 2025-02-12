CREATE TYPE "public"."rankLevel" AS ENUM('Enlisted', 'JNCO', 'SNCO', 'Company', 'Command');--> statement-breakpoint
CREATE TYPE "public"."scopes" AS ENUM('Admin', 'Recruitment', 'Training', 'Attendance', 'Roster', 'Qualifications', 'Mod', 'Zeus');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('Active', 'Inactive', 'Discharged');--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zeus_id" uuid,
	"co_zeus_ids" uuid[],
	"event_date" date DEFAULT now() NOT NULL,
	"event_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"unit_element_id" uuid,
	"superior_billet_id" uuid,
	"priority" integer DEFAULT -1 NOT NULL,
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
	"icon" varchar(255) DEFAULT '/images/9_logo.png' NOT NULL,
	"parent_id" uuid,
	"priority" integer DEFAULT -1 NOT NULL,
	"departmentScopes" "scopes"[] DEFAULT '{}' NOT NULL,
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
CREATE TABLE "qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"abbreviation" char(4) NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"trainee_ids" uuid[] DEFAULT '{}' NOT NULL,
	"qualification_id" uuid NOT NULL,
	"training_date" date DEFAULT now() NOT NULL,
	"training_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"recruitment_date" date DEFAULT now() NOT NULL,
	"attendances" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "troopers_numbers_unique" UNIQUE("numbers"),
	CONSTRAINT "number_check" CHECK (("troopers"."numbers" >= 1000 AND "troopers"."numbers" <= 9999))
);
--> statement-breakpoint
CREATE TABLE "unit_elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(255) DEFAULT '/images/9_logo.png' NOT NULL,
	"parent_id" uuid,
	"priority" integer DEFAULT -1 NOT NULL,
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
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_zeus_id_troopers_id_fk" FOREIGN KEY ("zeus_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billet_assignments" ADD CONSTRAINT "billet_assignments_billet_id_billets_id_fk" FOREIGN KEY ("billet_id") REFERENCES "public"."billets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billet_assignments" ADD CONSTRAINT "billet_assignments_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billets" ADD CONSTRAINT "billets_unit_element_id_unit_elements_id_fk" FOREIGN KEY ("unit_element_id") REFERENCES "public"."unit_elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_department_position_id_department_positions_id_fk" FOREIGN KEY ("department_position_id") REFERENCES "public"."department_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_assignments" ADD CONSTRAINT "department_assignments_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_positions" ADD CONSTRAINT "department_positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_next_rank_fkey" FOREIGN KEY ("next_rank_id") REFERENCES "public"."ranks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_trainer_id_troopers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_attendances" ADD CONSTRAINT "trooper_attendances_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_attendances" ADD CONSTRAINT "trooper_attendances_attendance_id_attendances_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_qualifications" ADD CONSTRAINT "trooper_qualifications_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trooper_qualifications" ADD CONSTRAINT "trooper_qualifications_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "troopers" ADD CONSTRAINT "troopers_rank_ranks_id_fk" FOREIGN KEY ("rank") REFERENCES "public"."ranks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_trooper_id_troopers_id_fk" FOREIGN KEY ("trooper_id") REFERENCES "public"."troopers"("id") ON DELETE cascade ON UPDATE no action;