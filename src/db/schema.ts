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
    jsonb,
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

// Keep eventTypes — still used by attendances.eventType (do not remove)
export const eventTypes = pgEnum("eventTypes", [
    "Main",
    "Skirmish",
    "Fun",
    "Raid",
    "Joint",
    "Training",
]);

// New enums for the hub-and-spoke event model
export const eventKind = pgEnum("eventKind", [
    "Operation",
    "Training",
    "Meeting",
    "Social",
]);

export const operationType = pgEnum("operationType", [
    "Main",
    "Skirmish",
    "Fun",
    "Raid",
    "Joint",
]);

export const qualificationCategory = pgEnum("qualification_category", [
    "Standard",
    "Medical",
    "Advanced",
    "Aviation",
    "Detachments",
    "Leadership",
]);

export const announcementCategory = pgEnum("announcement_category", [
    "News",
    "Announcement",
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
        numbers: integer("numbers").notNull(),
        name: varchar("name", { length: 100 }).notNull(),
        referredBy: uuid("referred_by"),
        recruitedBy: uuid("recruited_by"),
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
    category: qualificationCategory("category").notNull().default("Standard"),
    rankRequirement: varchar("rank_requirement", { length: 50 }).notNull().default("CT"),
    description: text("description"),
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

// Training Completions Table (renamed from trainings — completion records, not scheduled events)
export const trainingCompletions = pgTable("training_completions", {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
        .references(() => troopers.id)
        .notNull(),
    traineeIds: uuid("trainee_ids").array().notNull().default([]),
    qualificationId: uuid("qualification_id")
        .references(() => qualifications.id)
        .notNull(),
    trainingDate: date("training_date").defaultNow().notNull(),
    trainingNotes: text("training_notes").default(""),
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
    eventType: eventTypes("event_type").default("Main").notNull(),
    eventNotes: text("event_notes").default(""),
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
    slug: varchar("slug", { length: 100 }),
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
    description: text("description"),
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
    slug: varchar("slug", { length: 100 }),
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

// Campaigns Table
export const campaigns = pgTable("campaigns", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").default(""),
    startDate: date("start_date").defaultNow().notNull(),
    endDate: date("end_date"),
    isActive: boolean("is_active").default(true).notNull(),
    plannedOperationCount: integer("planned_operation_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Event Series Table (recurring operation slots — Admin/Command only)
export const eventSeries = pgTable("event_series", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    operationType: operationType("operation_type").notNull().default("Main"),
    campaignId: uuid("campaign_id").references(() => campaigns.id, {
        onDelete: "set null",
    }),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Sun, 6=Sat
    eventTime: varchar("event_time", { length: 10 }), // "HH:MM" UTC
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Events Table (renamed from campaign_events — scheduling shell)
export const events = pgTable("events", {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id").references(() => campaigns.id, {
        onDelete: "set null",
    }),
    seriesId: uuid("series_id").references(() => eventSeries.id, {
        onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").default(""),
    bannerImage: text("banner_image"),
    eventDate: date("event_date").defaultNow().notNull(),
    eventTime: varchar("event_time", { length: 10 }), // Format: "HH:MM" EST
    eventEndTime: varchar("event_end_time", { length: 10 }), // Format: "HH:MM" EST — used for Training events
    eventKind: eventKind("event_kind").notNull(),
    googleCalendarEventId: text("google_calendar_event_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Operations Table (one row per Operation event — child of events)
export const operations = pgTable("operations", {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
        .notNull()
        .unique()
        .references(() => events.id, { onDelete: "cascade" }),
    operationType: operationType("operation_type").notNull().default("Main"),
    operationName: varchar("operation_name", { length: 255 }), // Optional name given to this specific op
    transmittedById: uuid("transmitted_by_id").references(() => troopers.id, {
        onDelete: "set null",
    }),
    coTransmitterIds: uuid("co_transmitter_ids").array(),
    deployedForces: jsonb("deployed_forces").$type<Array<{ name: string; optional: boolean }>>(),
    objectives: jsonb("objectives").$type<Array<{ title: string; description: string; type?: "primary" | "secondary" }>>(),
    situationReport: text("situation_report"),
    eventNotes: text("event_notes"),
    attendanceId: uuid("attendance_id").references(() => attendances.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

// Trainings Table (scheduled training events — one row per Training event, child of events)
// NULL trainingCompletionId = not yet completed; NOT NULL = completed
export const trainingEvents = pgTable("trainings", {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
        .notNull()
        .unique()
        .references(() => events.id, { onDelete: "cascade" }),
    qualificationId: uuid("qualification_id").references(
        () => qualifications.id,
        { onDelete: "set null" }
    ),
    scheduledTrainerId: uuid("scheduled_trainer_id").references(
        () => troopers.id,
        { onDelete: "set null" }
    ),
    trainingCompletionId: uuid("training_completion_id").references(
        () => trainingCompletions.id,
        { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdateFn(() => new Date())
        .notNull(),
});

export const announcements = pgTable("announcements", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    category: announcementCategory("category").notNull().default("Announcement"),
    isImportant: boolean("is_important").default(false).notNull(),
    authorId: uuid("author_id").references(() => troopers.id, {
        onDelete: "set null",
    }),
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
export const selectEventKindSchema = createSelectSchema(eventKind);
export const selectOperationTypeSchema = createSelectSchema(operationType);

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

export const insertTrainingCompletionSchema = createInsertSchema(trainingCompletions);
export const selectTrainingCompletionSchema = createSelectSchema(trainingCompletions);

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

export const insertCampaignSchema = createInsertSchema(campaigns);
export const selectCampaignSchema = createSelectSchema(campaigns);

export const insertEventSeriesSchema = createInsertSchema(eventSeries);
export const selectEventSeriesSchema = createSelectSchema(eventSeries);

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);

export const insertOperationSchema = createInsertSchema(operations);
export const selectOperationSchema = createSelectSchema(operations);

export const insertTrainingEventSchema = createInsertSchema(trainingEvents);
export const selectTrainingEventSchema = createSelectSchema(trainingEvents);

export const insertAnnouncementSchema = createInsertSchema(announcements);
export const selectAnnouncementSchema = createSelectSchema(announcements);

// Relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
    events: many(events),
    eventSeries: many(eventSeries),
}));

export const eventSeriesRelations = relations(eventSeries, ({ one, many }) => ({
    campaign: one(campaigns, {
        fields: [eventSeries.campaignId],
        references: [campaigns.id],
    }),
    events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
    campaign: one(campaigns, {
        fields: [events.campaignId],
        references: [campaigns.id],
    }),
    series: one(eventSeries, {
        fields: [events.seriesId],
        references: [eventSeries.id],
    }),
    operation: one(operations, {
        fields: [events.id],
        references: [operations.eventId],
    }),
    trainingEvent: one(trainingEvents, {
        fields: [events.id],
        references: [trainingEvents.eventId],
    }),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
    event: one(events, {
        fields: [operations.eventId],
        references: [events.id],
    }),
    transmittedBy: one(troopers, {
        fields: [operations.transmittedById],
        references: [troopers.id],
    }),
    attendance: one(attendances, {
        fields: [operations.attendanceId],
        references: [attendances.id],
    }),
}));

export const trainingEventsRelations = relations(trainingEvents, ({ one }) => ({
    event: one(events, {
        fields: [trainingEvents.eventId],
        references: [events.id],
    }),
    qualification: one(qualifications, {
        fields: [trainingEvents.qualificationId],
        references: [qualifications.id],
    }),
    scheduledTrainer: one(troopers, {
        fields: [trainingEvents.scheduledTrainerId],
        references: [troopers.id],
    }),
    trainingCompletion: one(trainingCompletions, {
        fields: [trainingEvents.trainingCompletionId],
        references: [trainingCompletions.id],
    }),
}));

export const trooperAttendancesRelations = relations(
    trooperAttendances,
    ({ one }) => ({
        trooper: one(troopers, {
            fields: [trooperAttendances.trooperId],
            references: [troopers.id],
        }),
        attendance: one(attendances, {
            fields: [trooperAttendances.attendanceId],
            references: [attendances.id],
        }),
    })
);

export const billetAssignmentsRelations = relations(
    billetAssignments,
    ({ one }) => ({
        trooper: one(troopers, {
            fields: [billetAssignments.trooperId],
            references: [troopers.id],
        }),
        billet: one(billets, {
            fields: [billetAssignments.billetId],
            references: [billets.id],
        }),
    })
);

export const billetsRelations = relations(billets, ({ one }) => ({
    unitElement: one(unitElements, {
        fields: [billets.unitElementId],
        references: [unitElements.id],
    }),
}));

// Types
export type Status = z.infer<typeof selectStatusSchema>;
export type RankLevel = z.infer<typeof selectRankLevelSchema>;
export type EventTypes = z.infer<typeof selectEventTypesSchema>;
export type EventKind = z.infer<typeof selectEventKindSchema>;
export type OperationType = z.infer<typeof selectOperationTypeSchema>;

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

export type TrooperAttendance = z.infer<typeof selectTrooperAttendanceSchema>;
export type NewTrooperAttendance = z.infer<
    typeof insertTrooperAttendanceSchema
>;

export type UnitElement = z.infer<typeof selectUnitElementSchema>;

export type TrainingCompletion = z.infer<typeof selectTrainingCompletionSchema>;
export type NewTrainingCompletion = z.infer<typeof insertTrainingCompletionSchema>;

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

export type Campaign = z.infer<typeof selectCampaignSchema>;
export type NewCampaign = z.infer<typeof insertCampaignSchema>;

export type EventSeries = z.infer<typeof selectEventSeriesSchema>;
export type NewEventSeries = z.infer<typeof insertEventSeriesSchema>;

export type Event = z.infer<typeof selectEventSchema>;
export type NewEvent = z.infer<typeof insertEventSchema>;

export type Operation = z.infer<typeof selectOperationSchema>;
export type NewOperation = z.infer<typeof insertOperationSchema>;

export type TrainingEvent = z.infer<typeof selectTrainingEventSchema>;
export type NewTrainingEvent = z.infer<typeof insertTrainingEventSchema>;

export type Announcement = z.infer<typeof selectAnnouncementSchema>;
export type NewAnnouncement = z.infer<typeof insertAnnouncementSchema>;
