"use server";

import { db } from "@/db";
import {
    events,
    operations,
    trainingEvents,
    campaigns,
    NewEvent,
    NewOperation,
    NewTrainingEvent,
    attendances,
    trooperAttendances,
} from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
} from "@/services/google-calendar";

export interface CreateEventPayload {
    name: string;
    description?: string;
    bannerImage?: string | null;
    eventDate: string;
    eventTime?: string;
    eventEndTime?: string | null;
    eventKind: "Operation" | "Training" | "Meeting" | "Social";
    campaignId?: string | null;
    seriesId?: string | null;
    // Operation-specific
    operationType?: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint";
    operationName?: string | null;
    transmittedById?: string | null;
    deployedForces?: Array<{ name: string; optional: boolean }>;
    objectives?: Array<{ title: string; description: string }> | null;
    situationReport?: string;
    eventNotes?: string;
    // Training-specific
    qualificationId?: string | null;
    scheduledTrainerId?: string | null;
}

export interface OperationBriefPayload {
    operationType: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint";
    operationName?: string | null;
    transmittedById?: string | null;
    deployedForces?: Array<{ name: string; optional: boolean }>;
    objectives?: Array<{ title: string; description: string }> | null;
    situationReport?: string | null;
    eventNotes?: string | null;
}

export async function getEvents() {
    try {
        return await db.query.events.findMany({
            orderBy: [asc(events.eventDate)],
            with: {
                campaign: { columns: { name: true } },
                operation: true,
                trainingEvent: true,
            },
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getEventById(eventId: string) {
    try {
        return await db.query.events.findFirst({
            where: eq(events.id, eventId),
            with: {
                campaign: { columns: { name: true } },
                operation: true,
                trainingEvent: true,
            },
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        return null;
    }
}

export async function getCampaignEvents(campaignId: string) {
    try {
        return await db.query.events.findMany({
            where: eq(events.campaignId, campaignId),
            orderBy: [asc(events.eventDate)],
            with: {
                operation: true,
                trainingEvent: true,
            },
        });
    } catch (error) {
        console.error("Error fetching campaign events:", error);
        return [];
    }
}

export async function createEvent(payload: CreateEventPayload) {
    try {
        const result = await db.transaction(async (tx) => {
            // Create Google Calendar event stub
            const gcalId = await createCalendarEvent({
                summary: payload.name,
                description: payload.description ?? undefined,
                startDate: payload.eventDate,
                startTime: payload.eventTime ?? undefined,
            });

            // Insert the base event record
            const [newEvent] = await tx
                .insert(events)
                .values({
                    name: payload.name,
                    description: payload.description ?? "",
                    bannerImage: payload.bannerImage ?? null,
                    eventDate: payload.eventDate,
                    eventTime: payload.eventTime ?? null,
                    eventEndTime: payload.eventEndTime ?? null,
                    eventKind: payload.eventKind,
                    campaignId: payload.campaignId ?? null,
                    seriesId: payload.seriesId ?? null,
                    googleCalendarEventId: gcalId,
                })
                .returning();

            // Insert the child record based on eventKind
            // Series events skip the operations row — brief is created separately
            if (payload.eventKind === "Operation" && !payload.seriesId) {
                await tx.insert(operations).values({
                    eventId: newEvent.id,
                    operationType: payload.operationType ?? "Main",
                    operationName: payload.operationName ?? null,
                    transmittedById: payload.transmittedById ?? null,
                    deployedForces: payload.deployedForces ?? [],
                    objectives: payload.objectives ?? null,
                    situationReport: payload.situationReport ?? null,
                    eventNotes: payload.eventNotes ?? null,
                    attendanceId: null,
                });
            } else if (payload.eventKind === "Training") {
                await tx.insert(trainingEvents).values({
                    eventId: newEvent.id,
                    qualificationId: payload.qualificationId ?? null,
                    scheduledTrainerId: payload.scheduledTrainerId ?? null,
                    trainingCompletionId: null,
                });
            }

            return newEvent.id;
        });

        revalidateTag("events");
        revalidateTag("campaigns");
        return { success: true, id: result };
    } catch (error) {
        console.error("Error creating event:", error);
        return { error: "Failed to create event" };
    }
}

export async function updateEvent(
    eventId: string,
    payload: Partial<CreateEventPayload>
) {
    try {
        await db.transaction(async (tx) => {
            const existing = await tx.query.events.findFirst({
                where: eq(events.id, eventId),
            });

            if (!existing) throw new Error("Event not found");

            // Update base event
            const eventUpdateData: Partial<NewEvent> = {};
            if (payload.name !== undefined) eventUpdateData.name = payload.name;
            if (payload.description !== undefined) eventUpdateData.description = payload.description;
            if (payload.bannerImage !== undefined) eventUpdateData.bannerImage = payload.bannerImage ?? null;
            if (payload.eventDate !== undefined) eventUpdateData.eventDate = payload.eventDate;
            if (payload.eventTime !== undefined) eventUpdateData.eventTime = payload.eventTime ?? null;
            if (payload.eventEndTime !== undefined) eventUpdateData.eventEndTime = payload.eventEndTime ?? null;
            if (payload.campaignId !== undefined) eventUpdateData.campaignId = payload.campaignId ?? null;

            if (Object.keys(eventUpdateData).length > 0) {
                await tx.update(events).set(eventUpdateData).where(eq(events.id, eventId));
            }

            // Update Google Calendar if linked
            if (existing.googleCalendarEventId) {
                await updateCalendarEvent(existing.googleCalendarEventId, {
                    summary: payload.name ?? existing.name,
                    description: payload.description ?? existing.description ?? undefined,
                    startDate: payload.eventDate ?? existing.eventDate,
                    startTime: payload.eventTime ?? existing.eventTime ?? undefined,
                });
            }

            // Update the child record
            if (existing.eventKind === "Operation") {
                // Use Drizzle's inferred type (respects $type<>() on jsonb columns)
                // vs NewOperation from drizzle-zod which types jsonb as unknown
                const opUpdateData: Partial<typeof operations.$inferInsert> = {};
                if (payload.operationType !== undefined) opUpdateData.operationType = payload.operationType ?? "Main";
                if (payload.transmittedById !== undefined) opUpdateData.transmittedById = payload.transmittedById ?? null;
                if (payload.deployedForces !== undefined) opUpdateData.deployedForces = payload.deployedForces;
                if (payload.objectives !== undefined) opUpdateData.objectives = payload.objectives ?? null;
                if (payload.situationReport !== undefined) opUpdateData.situationReport = payload.situationReport ?? null;
                if (payload.eventNotes !== undefined) opUpdateData.eventNotes = payload.eventNotes ?? null;

                if (Object.keys(opUpdateData).length > 0) {
                    await tx
                        .update(operations)
                        .set(opUpdateData)
                        .where(eq(operations.eventId, eventId));
                }
            } else if (existing.eventKind === "Training") {
                const teUpdateData: Partial<NewTrainingEvent> = {};
                if (payload.qualificationId !== undefined) teUpdateData.qualificationId = payload.qualificationId ?? null;
                if (payload.scheduledTrainerId !== undefined) teUpdateData.scheduledTrainerId = payload.scheduledTrainerId ?? null;

                if (Object.keys(teUpdateData).length > 0) {
                    await tx
                        .update(trainingEvents)
                        .set(teUpdateData)
                        .where(eq(trainingEvents.eventId, eventId));
                }
            }
        });

        revalidateTag("events");
        revalidateTag("campaigns");
        return { success: true };
    } catch (error) {
        console.error("Error updating event:", error);
        return { error: "Failed to update event" };
    }
}

export async function createOperationBrief(eventId: string, payload: OperationBriefPayload) {
    try {
        await db.insert(operations).values({
            eventId,
            operationType: payload.operationType,
            operationName: payload.operationName ?? null,
            transmittedById: payload.transmittedById ?? null,
            deployedForces: payload.deployedForces ?? [],
            objectives: payload.objectives ?? null,
            situationReport: payload.situationReport ?? null,
            eventNotes: payload.eventNotes ?? null,
            attendanceId: null,
        });

        revalidateTag("events");
        return { success: true };
    } catch (error) {
        console.error("Error creating operation brief:", error);
        return { error: "Failed to create operation brief" };
    }
}

export async function updateOperationBrief(eventId: string, payload: Partial<OperationBriefPayload>) {
    try {
        const updateData: Partial<typeof operations.$inferInsert> = {};
        if (payload.operationType !== undefined) updateData.operationType = payload.operationType;
        if (payload.operationName !== undefined) updateData.operationName = payload.operationName ?? null;
        if (payload.transmittedById !== undefined) updateData.transmittedById = payload.transmittedById ?? null;
        if (payload.deployedForces !== undefined) updateData.deployedForces = payload.deployedForces;
        if (payload.objectives !== undefined) updateData.objectives = payload.objectives ?? null;
        if (payload.situationReport !== undefined) updateData.situationReport = payload.situationReport ?? null;
        if (payload.eventNotes !== undefined) updateData.eventNotes = payload.eventNotes ?? null;

        await db.update(operations).set(updateData).where(eq(operations.eventId, eventId));

        revalidateTag("events");
        return { success: true };
    } catch (error) {
        console.error("Error updating operation brief:", error);
        return { error: "Failed to update operation brief" };
    }
}

export async function deleteEvent(eventId: string) {
    try {
        await db.transaction(async (tx) => {
            const event = await tx.query.events.findFirst({
                where: eq(events.id, eventId),
                with: { operation: true },
            });

            if (!event) return;

            // Delete from Google Calendar if linked
            if (event.googleCalendarEventId) {
                await deleteCalendarEvent(event.googleCalendarEventId);
            }

            // If operation had an attendance record, clean it up
            if (event.operation?.attendanceId) {
                await tx
                    .delete(trooperAttendances)
                    .where(eq(trooperAttendances.attendanceId, event.operation.attendanceId));
                await tx
                    .delete(attendances)
                    .where(eq(attendances.id, event.operation.attendanceId));
            }

            // Delete event (cascades to operations/trainingEvents)
            await tx.delete(events).where(eq(events.id, eventId));
        });

        revalidateTag("events");
        revalidateTag("campaigns");
        return { success: true };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { error: "Failed to delete event" };
    }
}
