"use server";

import { db } from "@/db";
import {
    attendances,
    operations,
    NewAttendance,
    NewTrooperAttendance,
    trooperAttendances,
} from "@/db/schema";
import { findDifference } from "@/lib/utils";
import { and, eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";

/**
 * Logs attendance for a completed operation event.
 * Creates an attendances record + trooper_attendances rows,
 * then links the attendance ID into operations.attendanceId.
 */
export async function completeOperation(
    operationId: string,
    zeusId: string,
    coZeusIds: string[],
    trooperIds: string[],
    eventDate: string,
    eventType: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint" | "Training",
    eventName?: string,
    actorId?: string,
): Promise<{ success: true; attendanceId: string } | { error: string }> {
    try {
        const result = await db.transaction(async (tx) => {
            const operation = await tx.query.operations.findFirst({
                where: eq(operations.id, operationId),
            });

            if (!operation) throw new Error("Operation not found");
            if (operation.attendanceId) throw new Error("Operation already completed");

            const resolvedZeusId = zeusId || null;
            const opLabel = operation.operationName ?? eventName ?? "Operation";
            const eventNotes = `${opLabel} completion`;

            const [newAttendance] = await tx
                .insert(attendances)
                .values({
                    zeusId: resolvedZeusId,
                    coZeusIds,
                    eventDate,
                    eventType,
                    eventNotes,
                })
                .returning();

            // Include Zeus and co-Zeus in trooperAttendances so they appear in attendance records
            const allAttendeeIds = [
                ...(resolvedZeusId ? [resolvedZeusId] : []),
                ...coZeusIds,
                ...trooperIds,
            ].filter((id, i, arr) => arr.indexOf(id) === i); // deduplicate

            if (allAttendeeIds.length > 0) {
                await tx.insert(trooperAttendances).values(
                    allAttendeeIds.map((trooperId) => ({
                        attendanceId: newAttendance.id,
                        trooperId,
                    }))
                );
            }

            await tx
                .update(operations)
                .set({ attendanceId: newAttendance.id })
                .where(eq(operations.id, operationId));

            return newAttendance.id;
        });

        revalidateTag("operations");
        revalidateTag("events");

        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "attendance",
            entityId: result,
            entityLabel: `${eventDate} (${eventType})`,
            newData: { operationId, zeusId, coZeusIds, trooperIds, eventDate, eventType },
        });

        return { success: true, attendanceId: result };
    } catch (error) {
        console.error("Error completing operation:", error);
        return { error: "Failed to complete operation" };
    }
}

/**
 * Updates an existing attendance record (Zeus, co-Zeus, attendee list).
 * Used from the event attendance view.
 */
export async function updateOperation(
    operation: NewAttendance,
    attendees: string[],
    actorId?: string
) {
    try {
        const operationId = operation.id;
        if (!operationId) {
            throw new Error("Operation ID is required");
        }

        await db.transaction(async (tx) => {
            const oldOperation = await tx.query.attendances.findFirst({
                where: eq(attendances.id, operationId),
            });

            if (!oldOperation) {
                throw new Error("Existing Operation not found");
            }

            const currentAttendees = await tx.query.trooperAttendances
                .findMany({
                    where: eq(trooperAttendances.attendanceId, operationId),
                    columns: { trooperId: true },
                })
                .then((rows) => rows.map((r) => r.trooperId));

            // Include Zeus and co-Zeus in the full attendee list so they stay in trooperAttendances
            const resolvedZeusId = operation.zeusId ?? null;
            const resolvedCoZeusIds = operation.coZeusIds ?? [];
            const fullAttendees = [
                ...(resolvedZeusId ? [resolvedZeusId] : []),
                ...resolvedCoZeusIds,
                ...attendees,
            ].filter((id, i, arr) => arr.indexOf(id) === i);

            const addedAttendees = findDifference(fullAttendees, currentAttendees);
            const removedAttendees = findDifference(currentAttendees, fullAttendees);

            if (addedAttendees.length > 0) {
                await tx.insert(trooperAttendances).values(
                    addedAttendees.map(
                        (trooper) =>
                            ({
                                trooperId: trooper,
                                attendanceId: operationId,
                            } as NewTrooperAttendance)
                    )
                );
            }

            if (removedAttendees.length > 0) {
                await tx
                    .delete(trooperAttendances)
                    .where(
                        and(
                            eq(trooperAttendances.attendanceId, operationId),
                            inArray(trooperAttendances.trooperId, removedAttendees)
                        )
                    );
            }

            await tx
                .update(attendances)
                .set(operation)
                .where(eq(attendances.id, operationId));
        });

        revalidateTag("operations");

        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "attendance",
            entityId: operation.id!,
            entityLabel: operation.eventDate ? `${operation.eventDate} (${operation.eventType})` : undefined,
            newData: { ...operation, attendees } as unknown as Record<string, unknown>,
        });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update operation" };
    }
}

export async function deleteOperation(id: string, actorId?: string) {
    try {
        const previous = await db.query.attendances.findFirst({
            where: eq(attendances.id, id),
        });

        await db.transaction(async (tx) => {
            await tx.delete(attendances).where(eq(attendances.id, id));
        });

        revalidateTag("operations");

        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "attendance",
            entityId: id,
            entityLabel: previous ? `${previous.eventDate} (${previous.eventType})` : undefined,
            previousData: previous as unknown as Record<string, unknown>,
        });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to delete operation" };
    }
}
