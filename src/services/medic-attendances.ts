"use server";

import { db } from "@/db";
import {
    medicAttendances,
    billets,
    billetAssignments,
    troopers,
    unitElements,
    events,
    operations,
    ranks,
} from "@/db/schema";
import { eq, ilike, and, desc, lte, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";
import { getFullTrooperName } from "@/lib/utils";

const ALLOWED_ELEMENT_NAMES = ["Myth HQ", "Cinder HQ", "Cinder 1", "Cinder 2"];

export type MedicAttendanceInput = {
    medicId: string;
    elementId: string;
    operationType: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint" | "Training";
    eventId: string;
};

// Billets whose role contains "medic" (case-insensitive), with whoever
// currently holds that billet — used to populate the medic search field.
export async function getMedicOptions() {
    try {
        const results = await db
            .select({
                trooperId: troopers.id,
                name: troopers.name,
                numbers: troopers.numbers,
                rankAbbr: ranks.abbreviation,
                billetRole: billets.role,
            })
            .from(billets)
            .innerJoin(billetAssignments, eq(billetAssignments.billetId, billets.id))
            .innerJoin(troopers, eq(troopers.id, billetAssignments.trooperId))
            .leftJoin(ranks, eq(troopers.rank, ranks.id))
            .where(ilike(billets.role, "%medic%"));

        return results.map((row) => ({
            value: row.trooperId,
            label: getFullTrooperName({
                name: row.name,
                numbers: row.numbers,
                rankAbbr: row.rankAbbr,
            }),
        }));
    } catch (error) {
        console.error("Error fetching medic options:", error);
        return [];
    }
}

// The 4 unit elements this page is allowed to log against, always shown
// in this fixed order regardless of their priority in the org chart.
export async function getMedicElementOptions() {
    try {
        const results = await db.query.unitElements.findMany({
            where: inArray(unitElements.name, ALLOWED_ELEMENT_NAMES),
        });
        const sorted = [...results].sort(
            (a, b) =>
                ALLOWED_ELEMENT_NAMES.indexOf(a.name) -
                ALLOWED_ELEMENT_NAMES.indexOf(b.name),
        );
        return sorted.map((el) => ({ value: el.id, label: el.name }));
    } catch (error) {
        console.error("Error fetching medic element options:", error);
        return [];
    }
}

// Operations from the calendar, most recent first, for the required event
// link. Only includes operations happening today or in the past — future
// ones haven't happened yet, so there's nothing to log medic attendance for.
// Includes each event's operationType (pulled from its linked operations
// record) so the form can auto-fill it instead of asking the user to set it.
export async function getOperationEventOptions() {
    try {
        const today = new Date().toISOString().split("T")[0];
        const results = await db.query.events.findMany({
            where: and(eq(events.eventKind, "Operation"), lte(events.eventDate, today)),
            orderBy: [desc(events.eventDate)],
            columns: { id: true, name: true, eventDate: true, eventTime: true },
            with: {
                operation: { columns: { operationType: true } },
            },
        });
        return results.map((e) => ({
            value: e.id,
            label: `${e.name} — ${e.eventDate}${e.eventTime ? ` ${e.eventTime}` : ""}${
                e.operation?.operationType ? ` (${e.operation.operationType})` : ""
            }`,
            operationType: e.operation?.operationType ?? null,
        }));
    } catch (error) {
        console.error("Error fetching operation events:", error);
        return [];
    }
}

export async function getMedicAttendances() {
    try {
        return await db.query.medicAttendances.findMany({
            orderBy: [desc(medicAttendances.createdAt)],
            with: {
                medic: { columns: { id: true, name: true, numbers: true } },
                element: { columns: { id: true, name: true } },
                event: { columns: { id: true, name: true, eventDate: true } },
                submitter: { columns: { id: true, name: true } },
            },
        });
    } catch (error) {
        console.error("Error fetching medic attendances:", error);
        return [];
    }
}

export async function createMedicAttendance(
    input: MedicAttendanceInput,
    actorId?: string,
) {
    try {
        const [row] = await db
            .insert(medicAttendances)
            .values({
                medicId: input.medicId,
                elementId: input.elementId,
                operationType: input.operationType,
                eventId: input.eventId,
                submittedBy: actorId ?? null,
            })
            .returning();

        await createAuditLog({
            actorId: actorId ?? null,
            action: "CREATE",
            entityType: "medic_attendance",
            entityId: row.id,
            targetTrooperId: input.medicId,
            newData: input,
        });

        revalidateTag("medic-attendances");
        return { success: true, id: row.id };
    } catch (error) {
        console.error("Error creating medic attendance:", error);
        return { success: false, error: "Failed to log medic attendance" };
    }
}

export async function deleteMedicAttendance(id: string, actorId?: string) {
    try {
        await db.delete(medicAttendances).where(eq(medicAttendances.id, id));
        await createAuditLog({
            actorId: actorId ?? null,
            action: "DELETE",
            entityType: "medic_attendance",
            entityId: id,
        });
        revalidateTag("medic-attendances");
        return { success: true };
    } catch (error) {
        console.error("Error deleting medic attendance:", error);
        return { success: false, error: "Failed to delete medic attendance" };
    }
}