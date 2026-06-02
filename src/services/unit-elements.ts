"use server";

import { db } from "@/db";
import { unitElements } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";

export async function getAllUnitElements() {
    return db.query.unitElements.findMany({
        orderBy: [asc(unitElements.priority)],
    });
}

export async function getUnitElementsAsOptions() {
    const elements = await getAllUnitElements();
    return elements.map((e) => ({ value: e.id, label: e.name }));
}

export type UnitElementInput = {
    name: string;
    icon?: string;
    parentId?: string | null;
    priority?: number;
    radio?: string | null;
};

export async function createUnitElement(input: UnitElementInput, actorId?: string) {
    const [row] = await db.insert(unitElements).values(input).returning();
    revalidateTag("orbat");
    revalidateTag("unit-elements");
    await createAuditLog({
        actorId,
        action: "CREATE",
        entityType: "unit_element",
        entityId: row.id,
        entityLabel: row.name,
        newData: input as unknown as Record<string, unknown>,
    });
    return row;
}

export async function updateUnitElement(id: string, input: Partial<UnitElementInput>, actorId?: string) {
    const previous = await db.query.unitElements.findFirst({ where: eq(unitElements.id, id) });
    const [row] = await db.update(unitElements).set(input).where(eq(unitElements.id, id)).returning();
    revalidateTag("orbat");
    revalidateTag("unit-elements");
    await createAuditLog({
        actorId,
        action: "UPDATE",
        entityType: "unit_element",
        entityId: id,
        entityLabel: row.name,
        previousData: previous as unknown as Record<string, unknown>,
        newData: input as unknown as Record<string, unknown>,
    });
    return row;
}

export async function deleteUnitElement(id: string, actorId?: string) {
    const previous = await db.query.unitElements.findFirst({ where: eq(unitElements.id, id) });
    await db.delete(unitElements).where(eq(unitElements.id, id));
    revalidateTag("orbat");
    revalidateTag("unit-elements");
    await createAuditLog({
        actorId,
        action: "DELETE",
        entityType: "unit_element",
        entityId: id,
        entityLabel: previous?.name ?? undefined,
        previousData: previous as unknown as Record<string, unknown>,
    });
}
