"use server";

import { db } from "@/db";
import { eventSeries, events, operations } from "@/db/schema";
import { eq, asc, and, gte, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { addDays, addWeeks, differenceInDays, format, nextDay } from "date-fns";
import {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} from "@/services/google-calendar";
import { createAuditLog } from "@/services/audit";

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

export async function createSeries(payload: CreateSeriesPayload, actorId?: string) {
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

        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "event_series",
            entityId: result.id,
            entityLabel: result.name,
            newData: payload as unknown as Record<string, unknown>,
        });

        return { success: true, series: result };
    } catch (error) {
        console.error("Error creating event series:", error);
        return { error: "Failed to create event series" };
    }
}

export interface UpdateSeriesPayload {
    name?: string;
    eventTime?: string | null;
    location?: string | null;
    description?: string | null;
    operationType?: string | null;
}

export async function updateSeries(seriesId: string, payload: UpdateSeriesPayload, actorId?: string) {
    try {
        const today = format(new Date(), "yyyy-MM-dd");

        const series = await db.query.eventSeries.findFirst({
            where: eq(eventSeries.id, seriesId),
        });
        if (!series) return { error: "Series not found" };

        // Update the series record
        await db
            .update(eventSeries)
            .set({
                ...(payload.name !== undefined && { name: payload.name }),
                ...(payload.eventTime !== undefined && { eventTime: payload.eventTime }),
                ...(payload.location !== undefined && { location: payload.location }),
                ...(payload.description !== undefined && { description: payload.description }),
                ...(payload.operationType !== undefined && { operationType: payload.operationType as "Main" | "Skirmish" | "Fun" | "Raid" | "Joint" | null }),
            })
            .where(eq(eventSeries.id, seriesId));

        // Fetch future events to propagate changes
        const futureEvents = await db
            .select({
                id: events.id,
                eventDate: events.eventDate,
                googleCalendarEventId: events.googleCalendarEventId,
            })
            .from(events)
            .where(and(eq(events.seriesId, seriesId), gte(events.eventDate, today)));

        if (futureEvents.length > 0) {
            const isDescriptionKind = series.eventKind === "Meeting" || series.eventKind === "Social";
            const eventUpdates: Record<string, unknown> = {};
            if (payload.name !== undefined) eventUpdates.name = payload.name;
            if (payload.eventTime !== undefined) eventUpdates.eventTime = payload.eventTime;
            if (payload.location !== undefined) eventUpdates.location = payload.location;
            if (payload.description !== undefined && isDescriptionKind) {
                eventUpdates.description = payload.description;
            }

            if (Object.keys(eventUpdates).length > 0) {
                await db
                    .update(events)
                    .set(eventUpdates)
                    .where(inArray(events.id, futureEvents.map((e) => e.id)));
            }

            // Sync Google Calendar entries
            const updatedName = payload.name ?? series.name;
            const updatedTime = payload.eventTime !== undefined ? (payload.eventTime ?? undefined) : (series.eventTime ?? undefined);
            const updatedLocation = payload.location !== undefined ? (payload.location ?? undefined) : (series.location ?? undefined);

            for (const event of futureEvents) {
                if (event.googleCalendarEventId) {
                    await updateCalendarEvent(event.googleCalendarEventId, {
                        summary: updatedName,
                        startDate: event.eventDate,
                        startTime: updatedTime,
                        location: updatedLocation,
                    });
                }
            }
        }

        revalidateTag("events");
        revalidateTag("event-series");

        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "event_series",
            entityId: seriesId,
            entityLabel: payload.name ?? series.name,
            previousData: series as unknown as Record<string, unknown>,
            newData: payload as unknown as Record<string, unknown>,
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating series:", error);
        return { error: "Failed to update series" };
    }
}

export async function deactivateSeries(seriesId: string, actorId?: string) {
    try {
        const today = format(new Date(), "yyyy-MM-dd");

        // Fetch all future events for this series, joined with their operations row
        const futureEvents = await db
            .select({
                id: events.id,
                eventKind: events.eventKind,
                googleCalendarEventId: events.googleCalendarEventId,
                operationId: operations.id,
            })
            .from(events)
            .leftJoin(operations, eq(operations.eventId, events.id))
            .where(and(eq(events.seriesId, seriesId), gte(events.eventDate, today)));

        // For operation events: delete only those without a brief (no operations row).
        // For all other event kinds: delete unconditionally.
        const toDelete = futureEvents.filter(
            (e) => e.eventKind !== "Operation" || e.operationId === null
        );
        // Keep operation events that already have a brief, but detach them from the series
        const toDetach = futureEvents.filter(
            (e) => e.eventKind === "Operation" && e.operationId !== null
        );

        if (toDelete.length > 0) {
            // Clean up Google Calendar entries first
            for (const e of toDelete) {
                if (e.googleCalendarEventId) {
                    await deleteCalendarEvent(e.googleCalendarEventId);
                }
            }
            await db
                .delete(events)
                .where(inArray(events.id, toDelete.map((e) => e.id)));
        }

        if (toDetach.length > 0) {
            await db
                .update(events)
                .set({ seriesId: null })
                .where(inArray(events.id, toDetach.map((e) => e.id)));
        }

        await db
            .update(eventSeries)
            .set({ isActive: false })
            .where(eq(eventSeries.id, seriesId));

        revalidateTag("events");
        revalidateTag("event-series");

        const series = await db.query.eventSeries.findFirst({
            where: eq(eventSeries.id, seriesId),
            columns: { name: true },
        });
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "event_series",
            entityId: seriesId,
            entityLabel: series?.name,
        });

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

const SERIES_BUFFER: Record<string, number> = {
    Daily:     30,
    Weekly:     8,
    Biweekly:   6,
    Monthly:    4,
};

export async function ensureSeriesExtended() {
    try {
        const today = format(new Date(), "yyyy-MM-dd");

        const activeSeries = await db
            .select({ id: eventSeries.id, cadence: eventSeries.cadence })
            .from(eventSeries)
            .where(eq(eventSeries.isActive, true));

        for (const s of activeSeries) {
            const buffer = SERIES_BUFFER[s.cadence] ?? 8;

            const futureEvents = await db
                .select({ id: events.id })
                .from(events)
                .where(and(eq(events.seriesId, s.id), gte(events.eventDate, today)));

            if (futureEvents.length < buffer) {
                await extendSeries(s.id, buffer - futureEvents.length);
            }
        }
    } catch (error) {
        console.error("Error ensuring series extended:", error);
    }
}
