// Import Drizzle utilities
import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  serial,
  uuid,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
  foreignKey,
  check,
  text,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const status = pgEnum("status", ["Active", "Inactive", "Discharged"]);

// Players Table
export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: status().default("Active").notNull(),
    rank: integer("rank")
      .references(() => ranks.id)
      .notNull(),
    numbers: integer("numbers").notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    referredBy: uuid("referred_by"),
    recruitmentDate: date("recruitment_date").defaultNow(),
    attendances: integer("attendances").default(0).notNull(),
  },
  (table) => {
    return {
      checkConstraint: check(
        "number_check",
        sql`${table.status} != 'Discharged' AND (${table.numbers} >= 1000 AND ${table.numbers} <= 9999)`
      ),
    };
  }
);

// Qualifications Table
export const qualifications = pgTable("qualifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }),
});

// PlayerQualifications Join Table
export const playerQualifications = pgTable("player_qualifications", {
  playerId: uuid("player_id").references(() => players.id),
  qualificationId: uuid("qualification_id").references(() => qualifications.id),
});

// Attendances Table
export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  playerId: uuid("player_id").references(() => players.id),
  eventDate: date("event_date"),
  eventName: varchar("event_name", { length: 100 }),
});

// Ranks Table
export const ranks = pgTable(
  "ranks",
  {
    id: serial("id").primaryKey(),
    grade: varchar("grade", { length: 10 }), // e.g., O-1, N-2, E-1
    name: varchar("name", { length: 100 }), // Full rank name
    abbreviation: varchar("abbreviation", { length: 10 }), // Short form, e.g., CW, CL,
    jnco: boolean("JNCO").default(false),
    snco: boolean("SNCO").default(false),
    company: boolean("Company").default(false),
    command: boolean("Command").default(false),
    nextRankId: integer("next_rank_id"), // Points to the next rank
  },
  (table) => {
    return {
      parentReference: foreignKey({
        columns: [table.nextRankId],
        foreignColumns: [table.id],
        name: "ranks_next_rank_fkey",
      }),
    };
  }
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).unique().notNull(), // Primary identifier for credentials login
  hashedPassword: text("hashed_password"), // Password for credentials login
  discordId: varchar("discord_id", { length: 50 }).unique(), // Discord user ID
  playerId: uuid("player_id")
    .references(() => players.id)
    .notNull(), // Link to a player in the `players` table
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Generate and export schemas using drizzle-zod
export const selectSchema = createSelectSchema(status);

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);

export const insertQualificationSchema = createInsertSchema(qualifications);
export const selectQualificationSchema = createSelectSchema(qualifications);

export const insertPlayerQualificationSchema =
  createInsertSchema(playerQualifications);
export const selectPlayerQualificationSchema =
  createSelectSchema(playerQualifications);

export const insertAttendanceSchema = createInsertSchema(attendances);
export const selectAttendanceSchema = createSelectSchema(attendances);

export const insertRankSchema = createInsertSchema(ranks);
export const selectRankSchema = createSelectSchema(ranks);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Types
export type Player = z.infer<typeof selectPlayerSchema>;
export type NewPlayer = z.infer<typeof insertPlayerSchema>;
