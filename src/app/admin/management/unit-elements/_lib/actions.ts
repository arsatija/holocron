"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { unitElementFormSchema } from "./schema";
import { createUnitElement, updateUnitElement, deleteUnitElement } from "@/services/unit-elements";

async function getActorId(): Promise<string | undefined> {
    try {
        const cookieStore = await cookies();
        const raw = cookieStore.get("trooperCtx")?.value;
        if (!raw) return undefined;
        return JSON.parse(raw)?.id ?? undefined;
    } catch {
        return undefined;
    }
}

export async function createUnitElementAction(input: z.infer<typeof unitElementFormSchema>) {
    try {
        const data = unitElementFormSchema.parse(input);
        const actorId = await getActorId();
        const row = await createUnitElement({
            name: data.name,
            icon: data.icon,
            parentId: data.parentId ?? null,
            priority: data.priority,
            radio: data.radio ?? null,
        }, actorId);
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create unit element" };
    }
}

export async function updateUnitElementAction(id: string, input: z.infer<typeof unitElementFormSchema>) {
    try {
        const data = unitElementFormSchema.parse(input);
        const actorId = await getActorId();
        await updateUnitElement(id, {
            name: data.name,
            icon: data.icon,
            parentId: data.parentId ?? null,
            priority: data.priority,
            radio: data.radio ?? null,
        }, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to update unit element" };
    }
}

export async function deleteUnitElementAction(id: string) {
    try {
        const actorId = await getActorId();
        await deleteUnitElement(id, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete unit element" };
    }
}
