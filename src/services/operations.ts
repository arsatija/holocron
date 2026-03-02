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
    eventType: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint" | "Training"
): Promise<{ success: true; attendanceId: string } | { error: string }> {
    try {
        const result = await db.transaction(async (tx) => {
            const operation = await tx.query.operations.findFirst({
                where: eq(operations.id, operationId),
            });

            if (!operation) throw new Error("Operation not found");
            if (operation.attendanceId) throw new Error("Operation already completed");

            const [newAttendance] = await tx
                .insert(attendances)
                .values({
                    zeusId: zeusId || null,
                    coZeusIds,
                    eventDate,
                    eventType,
                    eventNotes: "",
                })
                .returning();

            if (trooperIds.length > 0) {
                await tx.insert(trooperAttendances).values(
                    trooperIds.map((trooperId) => ({
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
    attendees: string[]
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

            const addedAttendees = findDifference(attendees, currentAttendees);
            const removedAttendees = findDifference(currentAttendees, attendees);

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
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to update operation" };
    }
}

export async function deleteOperation(id: string) {
    try {
        await db.transaction(async (tx) => {
            await tx.delete(attendances).where(eq(attendances.id, id));
        });

        revalidateTag("operations");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to delete operation" };
    }
}
