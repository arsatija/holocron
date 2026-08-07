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
import { eq, ilike, and, desc, lte, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";
import { getFullTrooperName } from "@/lib/utils";

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

// Any unit element that has at least one billet with "medic" in the role
// name, plus "Myth" hardcoded in for non-main-op events regardless of
// whether it currently has a medic billet. New elements with a medic
// billet show up here automatically, no code change needed for those.
//
// Display order: Cinder HQ, then every descendant of Cinder HQ (any
// depth) that qualifies, then Hydra, then Cerberus, then Myth, then
// anything else that qualifies but isn't part of that structure.
export async function getMedicElementOptions() {
    try {
        type ElementRow = {
            id: string;
            name: string;
            parentId: string | null;
            priority: number;
        };

        const medicElements: ElementRow[] = await db
            .selectDistinct({
                id: unitElements.id,
                name: unitElements.name,
                parentId: unitElements.parentId,
                priority: unitElements.priority,
            })
            .from(billets)
            .innerJoin(unitElements, eq(billets.unitElementId, unitElements.id))
            .where(ilike(billets.role, "%medic%"));

        const mythElement = await db.query.unitElements.findFirst({
            where: eq(unitElements.name, "Myth HQ"),
            columns: { id: true, name: true, parentId: true, priority: true },
        });

        const byId = new Map<string, ElementRow>(
            medicElements.map((el) => [el.id, el]),
        );
        if (mythElement && !byId.has(mythElement.id)) {
            byId.set(mythElement.id, mythElement);
        }
        const all = [...byId.values()];

        const cinderHq = all.find((el) => el.name === "Cinder HQ");
        const hydra = all.find((el) => el.name === "Hydra");
        const cerberus = all.find((el) => el.name === "Cerberus");
        const myth = all.find((el) => el.name === "Myth HQ");

        function getDescendants(parentId: string): ElementRow[] {
            const children = all
                .filter((el) => el.parentId === parentId)
                .sort((a, b) => a.priority - b.priority);
            return children.flatMap((child) => [
                child,
                ...getDescendants(child.id),
            ]);
        }

        const ordered: ElementRow[] = [];
        const placedIds = new Set<string>();

        function place(el: ElementRow | undefined) {
            if (el && !placedIds.has(el.id)) {
                ordered.push(el);
                placedIds.add(el.id);
            }
        }

        place(cinderHq);
        if (cinderHq) {
            for (const descendant of getDescendants(cinderHq.id)) {
                place(descendant);
            }
        }
        place(hydra);
        place(cerberus);
        place(myth);

        const remaining = all
            .filter((el) => !placedIds.has(el.id))
            .sort((a, b) => a.priority - b.priority);
        for (const el of remaining) {
            place(el);
        }

        return ordered.map((el) => ({ value: el.id, label: el.name }));
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

// Every medic who has at least one logged attendance, with their total
// count — used for the NCO-Actions nav dropdown preview panel.
export async function getMedicAttendanceSnapshot() {
    try {
        const results = await db
            .select({
                medicId: troopers.id,
                name: troopers.name,
                numbers: troopers.numbers,
                rankAbbr: ranks.abbreviation,
                count: sql<number>`count(${medicAttendances.id})`.mapWith(Number),
            })
            .from(medicAttendances)
            .innerJoin(troopers, eq(troopers.id, medicAttendances.medicId))
            .leftJoin(ranks, eq(troopers.rank, ranks.id))
            .groupBy(troopers.id, ranks.abbreviation)
            .orderBy(desc(sql`count(${medicAttendances.id})`));

        return results.map((row) => ({
            id: row.medicId,
            name: getFullTrooperName({
                name: row.name,
                numbers: row.numbers,
                rankAbbr: row.rankAbbr,
            }),
            count: row.count,
        }));
    } catch (error) {
        console.error("Error fetching medic attendance snapshot:", error);
        return [];
    }
}