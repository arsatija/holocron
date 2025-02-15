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
export const scopes = pgEnum("scopes", [
    "Admin",
    "Recruitment",
    "Training",
    "Attendance",
    "Roster",
    "Qualifications",
    "Mod",
    "Zeus",
]);

export const eventTypes = pgEnum("eventTypes", [
    "Main",
    "Skirmish",
    "Fun",
    "Raid",
    "Joint",
]);

// Players Table
export const troopers = pgTable(
    "troopers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        status: status().default("Active").notNull(),
        rank: integer("rank")
            .references(() => ranks.id)
            .notNull()
            .default(24),
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
                sql`(${table.numbers} >= 1000 AND ${table.numbers} <= 9999)`
            ),
        };
    }
);

// Qualifications Table
export const qualifications = pgTable("qualifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull(),
    abbreviation: char("abbreviation", { length: 4 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// PlayerQualifications Join Table
export const trooperQualifications = pgTable("trooper_qualifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    trooperId: uuid("trooper_id")
        .references(() => troopers.id)
        .notNull(),
    qualificationId: uuid("qualification_id")
        .references(() => qualifications.id)
        .notNull(),
    earnedDate: date("earned_date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

export const trainings = pgTable("trainings", {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
        .references(() => troopers.id)
        .notNull(),
    traineeIds: uuid("trainee_ids").array().notNull().default([]),
    qualificationId: uuid("qualification_id")
        .references(() => qualifications.id)
        .notNull(),
    trainingDate: date("training_date").defaultNow().notNull(),
    trainingNotes: text("training_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Attendances Table
export const attendances = pgTable("attendances", {
    id: uuid("id").primaryKey().defaultRandom(),
    zeusId: uuid("zeus_id").references(() => troopers.id),
    coZeusIds: uuid("co_zeus_ids").array(),
    eventDate: date("event_date").defaultNow().notNull(),
    eventType: varchar("event_name", { length: 100 }).notNull(),
    eventNotes: text("event_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// TrooperAttendances Join Table
export const trooperAttendances = pgTable("trooper_attendances", {
    id: uuid("id").primaryKey().defaultRandom(),
    trooperId: uuid("trooper_id")
        .references(() => troopers.id, { onDelete: "cascade" })
        .notNull(),
    attendanceId: uuid("attendance_id")
        .references(() => attendances.id, { onDelete: "cascade" })
        .notNull(),
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
    unitElementId: uuid("unit_element_id").references(() => unitElements.id, {
        onDelete: "cascade",
    }),
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
        .references(() => billets.id, { onDelete: "cascade" })
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

// Departments Table
export const departments = pgTable("departments", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    icon: varchar("icon", { length: 255 })
        .notNull()
        .default("/images/9_logo.png"),
    parentId: uuid("parent_id"),
    priority: integer("priority").default(-1).notNull(),
    departmentScopes: scopes().array().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

export const departmentPositions = pgTable("department_positions", {
    id: uuid("id").primaryKey().defaultRandom(),
    role: varchar("role", { length: 255 }).notNull(),
    departmentId: uuid("department_id")
        .references(() => departments.id, { onDelete: "cascade" })
        .notNull(),
    superiorPositionId: uuid("superior_position_id"),
    priority: integer("priority").default(-1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// DepartmentAssignments Join Table
export const departmentAssignments = pgTable("department_assignments", {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentPositionId: uuid("department_position_id")
        .references(() => departmentPositions.id, { onDelete: "cascade" })
        .notNull(),
    trooperId: uuid("trooper_id")
        .references(() => troopers.id, { onDelete: "cascade" })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

export const invites = pgTable("invites", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").unique(),
    trooperId: uuid("trooper_id")
        .references(() => troopers.id)
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
});

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), //discord username
    trooperId: uuid("trooper_id")
        .references(() => troopers.id, { onDelete: "cascade" })
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
export const selectEventTypesSchema = createSelectSchema(eventTypes);

export const insertTrooperSchema = createInsertSchema(troopers);
export const selectTrooperSchema = createSelectSchema(troopers);

export const insertQualificationSchema = createInsertSchema(qualifications);
export const selectQualificationSchema = createSelectSchema(qualifications);

export const insertPlayerQualificationSchema = createInsertSchema(
    trooperQualifications
);
export const selectPlayerQualificationSchema = createSelectSchema(
    trooperQualifications
);

export const insertTrainingSchema = createInsertSchema(trainings);
export const selectTrainingSchema = createSelectSchema(trainings);

export const insertAttendanceSchema = createInsertSchema(attendances);
export const selectAttendanceSchema = createSelectSchema(attendances);

export const insertTrooperAttendanceSchema =
    createInsertSchema(trooperAttendances);
export const selectTrooperAttendanceSchema =
    createSelectSchema(trooperAttendances);

export const insertRankSchema = createInsertSchema(ranks);
export const selectRankSchema = createSelectSchema(ranks);

export const insertBilletSchema = createInsertSchema(billets);
export const selectBilletSchema = createSelectSchema(billets);

export const insertBilletAssignmentSchema =
    createInsertSchema(billetAssignments);
export const selectBilletAssignmentSchema =
    createSelectSchema(billetAssignments);

export const selectUnitElementSchema = createSelectSchema(unitElements);

export const insertDepartmentSchema = createInsertSchema(departments);
export const selectDepartmentSchema = createSelectSchema(departments);

export const insertDepartmentAssignmentSchema = createInsertSchema(
    departmentAssignments
);
export const selectDepartmentAssignmentSchema = createSelectSchema(
    departmentAssignments
);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Types
export type Status = z.infer<typeof selectStatusSchema>;
export type RankLevel = z.infer<typeof selectRankLevelSchema>;
export type EventTypes = z.infer<typeof selectEventTypesSchema>;

export type Trooper = z.infer<typeof selectTrooperSchema>;
export type NewTrooper = z.infer<typeof insertTrooperSchema>;

export type Rank = z.infer<typeof selectRankSchema>;
export type NewRank = z.infer<typeof insertRankSchema>;

export type Billet = z.infer<typeof selectBilletSchema>;
export type NewBillet = z.infer<typeof insertBilletSchema>;

export type BilletAssignment = z.infer<typeof selectBilletAssignmentSchema>;
export type NewBilletAssignment = z.infer<typeof insertBilletAssignmentSchema>;

export type Attendance = z.infer<typeof selectAttendanceSchema>;
export type NewAttendance = z.infer<typeof insertAttendanceSchema>;

export type UnitElement = z.infer<typeof selectUnitElementSchema>;

export type Training = z.infer<typeof selectTrainingSchema>;
export type NewTraining = z.infer<typeof insertTrainingSchema>;

export type Qualification = z.infer<typeof selectQualificationSchema>;
export type NewQualification = z.infer<typeof insertQualificationSchema>;

export type PlayerQualification = z.infer<
    typeof selectPlayerQualificationSchema
>;
export type NewPlayerQualification = z.infer<
    typeof insertPlayerQualificationSchema
>;

export type Department = z.infer<typeof selectDepartmentSchema>;
export type NewDepartment = z.infer<typeof insertDepartmentSchema>;

export type DepartmentAssignment = z.infer<
    typeof selectDepartmentAssignmentSchema
>;
export type NewDepartmentAssignment = z.infer<
    typeof insertDepartmentAssignmentSchema
>;

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
