ALTER TABLE "players" DROP CONSTRAINT "number_check";--> statement-breakpoint
ALTER TABLE "player_qualifications" DROP CONSTRAINT "player_qualifications_player_id_qualification_id_pk";--> statement-breakpoint
ALTER TABLE "attendances" ALTER COLUMN "player_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "player_qualifications" ALTER COLUMN "player_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "player_qualifications" ALTER COLUMN "qualification_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "referred_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "qualifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "ranks" ADD COLUMN "JNCO" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ranks" ADD COLUMN "SNCO" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ranks" ADD COLUMN "Company" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ranks" ADD COLUMN "Command" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ranks" DROP COLUMN "group";--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "number_check" CHECK ("players"."status" != 'Discharged' AND ("players"."numbers" >= 1000 AND "players"."numbers" <= 9999));