"use server";

import { db } from "@/db";
import { troopers, campaignEvents, campaigns, attendances, trainings } from "@/db/schema";
import { eq, not, gte, asc, count } from "drizzle-orm";
import { unstable_cache } from "@/lib/unstable-cache";

export interface HomepageStats {
    activeMembers: number;
    operationsRun: number;   // count of attendance records (logged operations)
    trainingsRun: number;    // count of training records
    nextEvent: { name: string; eventDate: string; eventTime: string | null } | null;
}

export const getHomepageStats = unstable_cache(
    async (): Promise<HomepageStats> => {
        const today = new Date().toISOString().split("T")[0];

        const [memberResult, operationsResult, trainingsResult, upcomingResult] =
            await Promise.all([
                // Active + inactive member count (not discharged)
                db
                    .select({ count: count() })
                    .from(troopers)
                    .where(not(eq(troopers.status, "Discharged"))),

                // Operations run = total attendance records
                db.select({ count: count() }).from(attendances),

                // Trainings run = total training records
                db.select({ count: count() }).from(trainings),

                // Next upcoming event
                db.query.campaignEvents.findFirst({
                    where: gte(campaignEvents.eventDate, today),
                    orderBy: [asc(campaignEvents.eventDate)],
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
    { tags: ["homepage-stats", "campaigns", "operations"], revalidate: 300 }
);

export const getUpcomingEvents = unstable_cache(
    async () => {
        const today = new Date().toISOString().split("T")[0];
        return db.query.campaignEvents.findMany({
            where: gte(campaignEvents.eventDate, today),
            orderBy: [asc(campaignEvents.eventDate)],
            limit: 5,
            with: {
                campaign: {
                    columns: { name: true },
                },
            },
        });
    },
    ["upcoming-events"],
    { tags: ["campaigns"], revalidate: 300 }
);

export const getActiveCampaigns = unstable_cache(
    async () => {
        return db.query.campaigns.findMany({
            where: eq(campaigns.isActive, true),
            orderBy: [asc(campaigns.startDate)],
            limit: 5,
        });
    },
    ["active-campaigns"],
    { tags: ["campaigns"], revalidate: 300 }
);
