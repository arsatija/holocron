"use server";

import { db } from "@/db";
import { eventSeries, events } from "@/db/schema";
import { eq, asc, and, gte } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { addDays, addWeeks, differenceInDays, format, nextDay } from "date-fns";
import {
    createCalendarEvent,
    deleteCalendarEvent,
} from "@/services/google-calendar";

export interface CreateSeriesPayload {
    name: string;
    eventKind: "Operation" | "Training" | "Meeting" | "Social";
    operationType?: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint" | null;
    cadence: "Daily" | "Weekly" | "Biweekly" | "Monthly";
    dayOfWeek: number; // 0=Sun … 6=Sat (ignored for Daily)
    startDate?: string | null; // "YYYY-MM-DD" — anchor for Biweekly/Monthly phase
    eventTime?: string | null; // "HH:MM"
    description?: string | null; // populated on events only for Meeting/Social
    location?: string | null; // populated on all events
    weeksToGenerate?: number; // default 8 occurrences
}

// ─── Occurrence generation ────────────────────────────────────────────────────

function getNthWeekday(year: number, month: number, dayOfWeek: number, n: number): Date | null {
    // month is 0-indexed
    const firstDay = new Date(year, month, 1);
    const diff = (dayOfWeek - firstDay.getDay() + 7) % 7;
    const firstOccurrence = new Date(year, month, 1 + diff);
    const result = new Date(firstOccurrence);
    result.setDate(result.getDate() + (n - 1) * 7);
    return result.getMonth() === month ? result : null;
}

function generateOccurrences(
    cadence: "Daily" | "Weekly" | "Biweekly" | "Monthly",
    dayOfWeek: number,
    anchor: Date, // startDate — phase reference for Biweekly/Monthly
    fromDate: Date,
    count: number,
): Date[] {
    const results: Date[] = [];

    if (cadence === "Daily") {
        const start = new Date(Math.max(fromDate.getTime(), anchor.getTime()));
        start.setHours(0, 0, 0, 0);
        for (let i = 0; i < count; i++) {
            results.push(addDays(start, i));
        }
        return results;
    }

    if (cadence === "Weekly") {
        const dow = dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const first = start.getDay() === dow ? start : nextDay(start, dow);
        for (let i = 0; i < count; i++) {
            results.push(addWeeks(first, i));
        }
        return results;
    }

    if (cadence === "Biweekly") {
        const dow = dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        let candidate = start.getDay() === dow ? start : nextDay(start, dow);

        // Check if candidate is in phase with anchor (same biweekly slot)
        const anchorNorm = new Date(anchor);
        anchorNorm.setHours(0, 0, 0, 0);
        const weeksApart = Math.round(differenceInDays(candidate, anchorNorm) / 7);
        if (weeksApart % 2 !== 0) {
            // Wrong phase — shift one week to align
            candidate = addWeeks(candidate, 1);
        }

        for (let i = 0; i < count; i++) {
            results.push(addWeeks(candidate, i * 2));
        }
        return results;
    }

    if (cadence === "Monthly") {
        // Derive which nth weekday of month from the anchor
        const anchorNorm = new Date(anchor);
        anchorNorm.setHours(0, 0, 0, 0);
        const n = Math.floor((anchorNorm.getDate() - 1) / 7) + 1; // 1-indexed nth occurrence

        let year = fromDate.getFullYear();
        let month = fromDate.getMonth(); // 0-indexed

        while (results.length < count) {
            const occurrence = getNthWeekday(year, month, dayOfWeek, n);
            if (occurrence && occurrence >= fromDate) {
                results.push(occurrence);
            }
            month++;
            if (month > 11) { month = 0; year++; }
        }
        return results;
    }

    return results;
}

// ─── Service functions ────────────────────────────────────────────────────────

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
        const occurrenceCount = payload.weeksToGenerate ?? 8;
        const cadence = payload.cadence ?? "Weekly";
        const eventKindVal = payload.eventKind ?? "Operation";

        // Parse anchor date (for Biweekly/Monthly phase calculation)
        const anchorDate = payload.startDate
            ? new Date(payload.startDate + "T00:00:00")
            : new Date();
        anchorDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const occurrences = generateOccurrences(
            cadence,
            payload.dayOfWeek,
            anchorDate,
            today,
            occurrenceCount,
        );

        const result = await db.transaction(async (tx) => {
            const [newSeries] = await tx
                .insert(eventSeries)
                .values({
                    name: payload.name,
                    eventKind: eventKindVal,
                    operationType: eventKindVal === "Operation" ? (payload.operationType ?? "Main") : null,
                    cadence,
                    startDate: payload.startDate ?? null,
                    description: payload.description ?? null,
                    location: payload.location ?? null,
                    dayOfWeek: payload.dayOfWeek,
                    eventTime: payload.eventTime ?? null,
                    isActive: true,
                })
                .returning();

            for (const occurrenceDate of occurrences) {
                const dateStr = format(occurrenceDate, "yyyy-MM-dd");

                const gcalId = await createCalendarEvent({
                    summary: payload.name,
                    startDate: dateStr,
                    startTime: payload.eventTime ?? undefined,
                });

                const populatesDescription = eventKindVal === "Meeting" || eventKindVal === "Social";
                await tx.insert(events).values({
                    name: payload.name,
                    eventDate: dateStr,
                    eventTime: payload.eventTime ?? null,
                    eventKind: eventKindVal,
                    description: populatesDescription ? (payload.description ?? null) : null,
                    location: payload.location ?? null,
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

export async function extendSeries(seriesId: string, additionalOccurrences = 4) {
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

        let fromDate: Date;
        if (futureEvents.length > 0) {
            const lastDate = futureEvents[futureEvents.length - 1].eventDate;
            // Start generating from 1 day after the last known event
            fromDate = addDays(new Date(lastDate + "T00:00:00"), 1);
        } else {
            fromDate = new Date();
            fromDate.setHours(0, 0, 0, 0);
        }

        const cadence = series.cadence ?? "Weekly";
        const eventKindVal = series.eventKind ?? "Operation";

        const anchorDate = series.startDate
            ? new Date(series.startDate + "T00:00:00")
            : fromDate;
        anchorDate.setHours(0, 0, 0, 0);

        const occurrences = generateOccurrences(
            cadence,
            series.dayOfWeek,
            anchorDate,
            fromDate,
            additionalOccurrences,
        );

        await db.transaction(async (tx) => {
            for (const occurrenceDate of occurrences) {
                const dateStr = format(occurrenceDate, "yyyy-MM-dd");

                const gcalId = await createCalendarEvent({
                    summary: series.name,
                    startDate: dateStr,
                    startTime: series.eventTime ?? undefined,
                });

                const populatesDescription = eventKindVal === "Meeting" || eventKindVal === "Social";
                await tx.insert(events).values({
                    name: series.name,
                    eventDate: dateStr,
                    eventTime: series.eventTime ?? null,
                    eventKind: eventKindVal,
                    description: populatesDescription ? (series.description ?? null) : null,
                    location: series.location ?? null,
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
