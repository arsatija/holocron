// Import Drizzle utilities
import { relations, sql } from "drizzle-orm";
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
    char,
} from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const status = pgEnum("status", ["Active", "Inactive", "Discharged"]);
export const rankLevel = pgEnum("rankLevel", [
    "Enlisted",
    "JNCO",
    "SNCO",
    "Company",
    "Command",
]);

// Players Table
export const troopers = pgTable(
    "troopers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        status: status().default("Active").notNull(),
        rank: integer("rank")
            .references(() => ranks.id)
            .notNull().default(24),
        numbers: integer("numbers").notNull().unique(),
        name: varchar("name", { length: 100 }).notNull(),
        referredBy: uuid("referred_by"),
        recruitmentDate: date("recruitment_date").defaultNow().notNull(),
        attendances: integer("attendances").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdateFn(() => new Date())
            .notNull(),
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
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    abbreviation: char("abbreviation", { length: 4 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// PlayerQualifications Join Table
export const playerQualifications = pgTable("player_qualifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    trooperId: uuid("trooper_id")
        .references(() => troopers.id)
        .notNull(),
    qualificationId: integer("qualification_id")
        .references(() => qualifications.id)
        .notNull(),
    earnedDate: date("earned_date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Attendances Table
export const attendances = pgTable("attendances", {
    id: serial("id").primaryKey(),
    trooperId: uuid("trooper_id").references(() => troopers.id),
    eventDate: date("event_date"),
    eventName: varchar("event_name", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Ranks Table
export const ranks = pgTable(
    "ranks",
    {
        id: serial("id").primaryKey(),
        grade: varchar("grade", { length: 10 }), // e.g., O-1, N-2, E-1
        name: varchar("name", { length: 100 }), // Full rank name
        abbreviation: varchar("abbreviation", { length: 10 }), // Short form, e.g., CW, CL,
        rankLevel: rankLevel().default("Enlisted").notNull(), // Level of rank (aka permissions)
        nextRankId: integer("next_rank_id"), // Points to the next rank
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdateFn(() => new Date())
            .notNull(),
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

export const unitElements = pgTable("unit_elements", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    icon: varchar("icon", { length: 255 })
        .notNull()
        .default("/images/9_logo.png"),
    parentId: uuid("parent_id"),
    priority: integer("priority").default(-1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

export const billets = pgTable("billets", {
    id: uuid("id").primaryKey().defaultRandom(),
    role: varchar("role", { length: 100 }).notNull().default("Trooper"),
    unitElementId: uuid("unit_element_id").references(() => unitElements.id),
    superiorBilletId: uuid("superior_billet_id"),
    priority: integer("priority").default(-1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

export const billetAssignments = pgTable("billet_assignments", {
    id: uuid("id").primaryKey().defaultRandom(),
    billetId: uuid("billet_id")
        .references(() => billets.id)
        .notNull()
        .unique(),
    trooperId: uuid("trooper_id")
        .references(() => troopers.id, { onDelete: "cascade" })
        .unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date()),
});

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 50 }).unique().notNull(), // Primary identifier for credentials login
    hashedPassword: text("hashed_password"), // Password for credentials login
    discordId: varchar("discord_id", { length: 50 }).unique(), // Discord user ID
    trooperId: uuid("trooper_id")
        .references(() => troopers.id)
        .notNull(), // Link to a player in the `players` table
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Generate and export schemas using drizzle-zod
export const selectStatusSchema = createSelectSchema(status);
export const selectRankLevelSchema = createSelectSchema(rankLevel);

export const insertTrooperSchema = createInsertSchema(troopers);
export const selectTrooperSchema = createSelectSchema(troopers);

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

export const insertBilletSchema = createInsertSchema(billets);
export const selectBilletSchema = createSelectSchema(billets);

export const insertBilletAssignmentSchema =
    createInsertSchema(billetAssignments);
export const selectBilletAssignmentSchema =
    createSelectSchema(billetAssignments);

export const selectUnitElementSchema = createSelectSchema(unitElements);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Types
export type Status = z.infer<typeof selectStatusSchema>;
export type RankLevel = z.infer<typeof selectRankLevelSchema>;

export type Trooper = z.infer<typeof selectTrooperSchema>;
export type NewTrooper = z.infer<typeof insertTrooperSchema>;

export type Rank = z.infer<typeof selectRankSchema>;
export type NewRank = z.infer<typeof insertRankSchema>;

export type Billet = z.infer<typeof selectBilletSchema>;
export type NewBillet = z.infer<typeof insertBilletSchema>;

export type BilletAssignment = z.infer<typeof selectBilletAssignmentSchema>;
export type NewBilletAssignment = z.infer<typeof insertBilletAssignmentSchema>;

export type UnitElement = z.infer<typeof selectUnitElementSchema>;

export type Qualification = z.infer<typeof selectQualificationSchema>;
export type NewQualification = z.infer<typeof insertQualificationSchema>;

export type PlayerQualification = z.infer<
    typeof selectPlayerQualificationSchema
>;
export type NewPlayerQualification = z.infer<
    typeof insertPlayerQualificationSchema
>;