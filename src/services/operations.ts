"use server";

import { db } from "@/db";
import {
    attendances,
    NewAttendance,
    NewTrooperAttendance,
    trooperAttendances,
} from "@/db/schema";
import { findDifference } from "@/lib/utils";
import { and, eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function getOperations() {}

export async function getOperationById(id: string) {}

export async function createOperation(operation: NewAttendance) {}

export async function updateOperation(
    operation: NewAttendance,
    attendees: string[]
) {
    try {
        const operationId = operation.id;
        if (!operationId) {
            throw new Error("Operation ID is required");
        }

        const result = await db.transaction(async (tx) => {
            const oldOperation = await tx.query.attendances.findFirst({
                where: eq(attendances.id, operationId),
            });

            if (!oldOperation) {
                throw new Error("Exisitng Operation not found");
            }

            const currentAttendees = await tx.query.trooperAttendances
                .findMany({
                    where: eq(trooperAttendances.attendanceId, operationId),
                    columns: {
                        trooperId: true,
                    },
                })
                .then((attendances) =>
                    attendances.map((attendance) => attendance.trooperId)
                );

            const addedAttendees = findDifference(attendees, currentAttendees);
            const removedAttendees = findDifference(
                currentAttendees,
                attendees
            );

            const attendancesToAdd = addedAttendees.map(
                (trooper) =>
                    ({
                        trooperId: trooper,
                        attendanceId: operationId,
                    } as NewTrooperAttendance)
            );

            if (attendancesToAdd.length > 0) {
                await tx.insert(trooperAttendances).values(attendancesToAdd);
            }

            if (removedAttendees.length > 0) {
                await tx
                    .delete(trooperAttendances)
                    .where(
                        and(
                            eq(trooperAttendances.attendanceId, operationId),
                            inArray(
                                trooperAttendances.trooperId,
                                removedAttendees
                            )
                        )
                    );
            }

            // Update attendance entry for attendanceId
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
