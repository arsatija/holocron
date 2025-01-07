CREATE TYPE "public"."status" AS ENUM('Active', 'Inactive', 'Discharged');--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer,
	"event_date" date,
	"event_name" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "player_qualifications" (
	"player_id" integer,
	"qualification_id" integer,
	CONSTRAINT "player_qualifications_player_id_qualification_id_pk" PRIMARY KEY("player_id","qualification_id")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" "status" DEFAULT 'Active',
	"rank" integer,
	"numbers" integer NOT NULL,
	"name" varchar(100),
	"referred_by" varchar,
	"recruitment_date" date DEFAULT now(),
	"attendances" integer DEFAULT 0,
	CONSTRAINT "players_numbers_unique" UNIQUE("numbers"),
	CONSTRAINT "number_check" CHECK ("players"."status" != $1 AND ("players"."numbers" >= 1000 AND "players"."numbers" <= 9999))
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "ranks" (
	"id" serial PRIMARY KEY NOT NULL,
	"grade" varchar(10),
	"name" varchar(100),
	"abbreviation" varchar(10),
	"group" varchar(50),
	"next_rank_id" integer
);
--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_qualifications" ADD CONSTRAINT "player_qualifications_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_qualifications" ADD CONSTRAINT "player_qualifications_qualification_id_qualifications_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_rank_ranks_id_fk" FOREIGN KEY ("rank") REFERENCES "public"."ranks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_next_rank_fkey" FOREIGN KEY ("next_rank_id") REFERENCES "public"."ranks"("id") ON DELETE no action ON UPDATE no action;