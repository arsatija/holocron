"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { billetFormSchema } from "./schema";
import { createBillet, updateBillet, deleteBillet, bulkUpdateBilletOrder } from "@/services/billets";

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

export async function createBilletAction(input: z.infer<typeof billetFormSchema>) {
    try {
        const data = billetFormSchema.parse(input);
        const actorId = await getActorId();
        const row = await createBillet({
            role: data.role,
            slug: data.slug ?? null,
            unitElementId: data.unitElementId,
            superiorBilletId: data.superiorBilletId ?? null,
            priority: data.priority,
        }, actorId);
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create billet" };
    }
}

export async function updateBilletAction(id: string, input: z.infer<typeof billetFormSchema>) {
    try {
        const data = billetFormSchema.parse(input);
        const actorId = await getActorId();
        await updateBillet(id, {
            role: data.role,
            slug: data.slug ?? null,
            unitElementId: data.unitElementId,
            superiorBilletId: data.superiorBilletId ?? null,
            priority: data.priority,
        }, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to update billet" };
    }
}

export async function deleteBilletAction(id: string) {
    try {
        const actorId = await getActorId();
        await deleteBillet(id, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete billet" };
    }
}

export async function bulkUpdateBilletOrderAction(
    updates: { id: string; unitElementId: string; priority: number }[]
) {
    try {
        const actorId = await getActorId();
        await bulkUpdateBilletOrder(updates, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to save order" };
    }
}
