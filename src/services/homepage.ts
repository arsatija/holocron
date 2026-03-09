"use server";

import { db } from "@/db";
import {
    troopers,
    events,
    campaigns,
    operations,
    attendances,
    trainingCompletions,
} from "@/db/schema";
import {
    eq,
    not,
    gte,
    asc,
    count,
    and,
    getTableColumns,
    sql,
} from "drizzle-orm";
import { unstable_cache } from "@/lib/unstable-cache";

export interface HomepageStats {
    activeMembers: number;
    operationsRun: number; // count of attendance records (logged operations)
    trainingsRun: number; // count of training completion records
    nextEvent: {
        name: string;
        eventDate: string;
        eventTime: string | null;
    } | null;
}

export const getHomepageStats = unstable_cache(
    async (): Promise<HomepageStats> => {
        const today = new Date().toISOString().split("T")[0];

        const [
            memberResult,
            operationsResult,
            trainingsResult,
            upcomingResult,
        ] = await Promise.all([
            // Active + inactive member count (not discharged)
            db
                .select({ count: count() })
                .from(troopers)
                .where(not(eq(troopers.status, "Discharged"))),

            // Operations run = total attendance records
            db.select({ count: count() }).from(attendances),

            // Trainings run = total training completion records
            db.select({ count: count() }).from(trainingCompletions),

            // Next upcoming event
            db.query.events.findFirst({
                where: gte(events.eventDate, today),
                orderBy: [asc(events.eventDate)],
                columns: {
                    name: true,
                    eventDate: true,
                    eventTime: true,
                },
            }),
        ]);

        return {
            activeMembers: memberResult[0]?.count ?? 0,
            operationsRun: operationsResult[0]?.count ?? 0,
            trainingsRun: trainingsResult[0]?.count ?? 0,
            nextEvent: upcomingResult ?? null,
        };
    },
    ["homepage-stats"],
    { tags: ["homepage-stats", "campaigns", "operations"], revalidate: 300 },
);

export const getUpcomingEvents = unstable_cache(
    async () => {
        const today = new Date().toISOString().split("T")[0];
        return db.query.events.findMany({
            where: gte(events.eventDate, today),
            orderBy: [asc(events.eventDate)],
            limit: 5,
            with: {
                campaign: {
                    columns: { name: true },
                },
                operation: {
                    columns: {
                        operationName: true,
                    },
                },
            },
        });
    },
    ["upcoming-events"],
    { tags: ["campaigns"], revalidate: 300 },
);

export const getActiveCampaigns = unstable_cache(
    async () => {
        const campaignCols = getTableColumns(campaigns);
        return db
            .select({
                ...campaignCols,
                operationCount: count(operations.id),
                completedOperationCount:
                    sql<number>`count(case when ${operations.attendanceId} is not null then 1 end)`.mapWith(
                        Number,
                    ),
            })
            .from(campaigns)
            .leftJoin(events, eq(events.campaignId, campaigns.id))
            .leftJoin(operations, eq(operations.eventId, events.id))
            .where(eq(campaigns.isActive, true))
            .groupBy(campaigns.id)
            .orderBy(asc(campaigns.startDate))
            .limit(5);
    },
    ["active-campaigns"],
    { tags: ["campaigns"], revalidate: 300 },
);
