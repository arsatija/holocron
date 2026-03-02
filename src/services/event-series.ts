"use server";

import { db } from "@/db";
import { eventSeries, events } from "@/db/schema";
import { eq, asc, and, gte } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { addWeeks, format, nextDay } from "date-fns";
import {
    createCalendarEvent,
    deleteCalendarEvent,
} from "@/services/google-calendar";

export interface CreateSeriesPayload {
    name: string;
    operationType: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint";
    dayOfWeek: number; // 0=Sun … 6=Sat
    eventTime?: string | null; // "HH:MM"
    weeksToGenerate?: number; // default 8
}

export async function getActiveSeries() {
    try {
        return await db.query.eventSeries.findMany({
            where: eq(eventSeries.isActive, true),
            orderBy: [asc(eventSeries.name)],
            with: {
                campaign: { columns: { name: true } },
            },
        });
    } catch (error) {
        console.error("Error fetching event series:", error);
        return [];
    }
}

export async function createSeries(payload: CreateSeriesPayload) {
    try {
        const weeksToGenerate = payload.weeksToGenerate ?? 8;

        const result = await db.transaction(async (tx) => {
            // Insert the series record
            const [newSeries] = await tx
                .insert(eventSeries)
                .values({
                    name: payload.name,
                    operationType: payload.operationType,
                    dayOfWeek: payload.dayOfWeek,
                    eventTime: payload.eventTime ?? null,
                    isActive: true,
                })
                .returning();

            // Compute the next N occurrences of dayOfWeek starting from today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find the first occurrence on or after today
            const dow = payload.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6;
            let firstDate: Date;
            if (today.getDay() === dow) {
                firstDate = today;
            } else {
                firstDate = nextDay(today, dow);
            }

            // Generate event rows for the next N weeks
            for (let i = 0; i < weeksToGenerate; i++) {
                const occurrenceDate = addWeeks(firstDate, i);
                const dateStr = format(occurrenceDate, "yyyy-MM-dd");

                // Create Google Calendar event stub
                const gcalId = await createCalendarEvent({
                    summary: payload.name,
                    startDate: dateStr,
                    startTime: payload.eventTime ?? undefined,
                });

                await tx.insert(events).values({
                    name: payload.name,
                    eventDate: dateStr,
                    eventTime: payload.eventTime ?? null,
                    eventKind: "Operation",
                    seriesId: newSeries.id,
                    googleCalendarEventId: gcalId,
                });
            }

            return newSeries;
        });

        revalidateTag("events");
        revalidateTag("event-series");
        return { success: true, series: result };
    } catch (error) {
        console.error("Error creating event series:", error);
        return { error: "Failed to create event series" };
    }
}

export async function deactivateSeries(seriesId: string) {
    try {
        // Deactivate the series (does not delete existing events)
        await db
            .update(eventSeries)
            .set({ isActive: false })
            .where(eq(eventSeries.id, seriesId));

        revalidateTag("event-series");
        return { success: true };
    } catch (error) {
        console.error("Error deactivating event series:", error);
        return { error: "Failed to deactivate series" };
    }
}

export async function extendSeries(seriesId: string, additionalWeeks = 4) {
    try {
        const today = format(new Date(), "yyyy-MM-dd");

        const series = await db.query.eventSeries.findFirst({
            where: eq(eventSeries.id, seriesId),
        });

        if (!series) return { error: "Series not found" };

        // Find the last future event to determine where to start generating from
        const futureEvents = await db
            .select({ eventDate: events.eventDate })
            .from(events)
            .where(and(eq(events.seriesId, seriesId), gte(events.eventDate, today)))
            .orderBy(asc(events.eventDate));

        let startFrom: Date;
        if (futureEvents.length > 0) {
            const lastDate = futureEvents[futureEvents.length - 1].eventDate;
            startFrom = addWeeks(new Date(lastDate + "T00:00:00"), 1);
        } else {
            // No future events — restart from next occurrence of the series day
            const nowDate = new Date();
            nowDate.setHours(0, 0, 0, 0);
            const dow = series.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6;
            startFrom = nowDate.getDay() === dow ? nowDate : nextDay(nowDate, dow);
        }

        await db.transaction(async (tx) => {
            for (let i = 0; i < additionalWeeks; i++) {
                const occurrenceDate = addWeeks(startFrom, i);
                const dateStr = format(occurrenceDate, "yyyy-MM-dd");

                const gcalId = await createCalendarEvent({
                    summary: series.name,
                    startDate: dateStr,
                    startTime: series.eventTime ?? undefined,
                });

                await tx.insert(events).values({
                    name: series.name,
                    eventDate: dateStr,
                    eventTime: series.eventTime ?? null,
                    eventKind: "Operation",
                    seriesId: series.id,
                    googleCalendarEventId: gcalId,
                });
            }
        });

        revalidateTag("events");
        return { success: true };
    } catch (error) {
        console.error("Error extending series:", error);
        return { error: "Failed to extend series" };
    }
}

export async function ensureSeriesExtended() {
    try {
        const today = format(new Date(), "yyyy-MM-dd");

        const activeSeries = await db
            .select({ id: eventSeries.id })
            .from(eventSeries)
            .where(eq(eventSeries.isActive, true));

        for (const s of activeSeries) {
            const futureEvents = await db
                .select({ id: events.id })
                .from(events)
                .where(and(eq(events.seriesId, s.id), gte(events.eventDate, today)));

            if (futureEvents.length < 8) {
                await extendSeries(s.id, 8 - futureEvents.length);
            }
        }
    } catch (error) {
        console.error("Error ensuring series extended:", error);
    }
}
