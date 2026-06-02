"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { rankFormSchema } from "./schema";
import { createRank, updateRank, deleteRank } from "@/services/ranks";

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

export async function createRankAction(input: z.infer<typeof rankFormSchema>) {
    try {
        const data = rankFormSchema.parse(input);
        const actorId = await getActorId();
        const row = await createRank({
            name: data.name,
            grade: data.grade ?? null,
            abbreviation: data.abbreviation ?? null,
            rankLevel: data.rankLevel,
            order: data.order ?? null,
            nextRankId: data.nextRankId ?? null,
        }, actorId);
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create rank" };
    }
}

export async function updateRankAction(id: number, input: z.infer<typeof rankFormSchema>) {
    try {
        const data = rankFormSchema.parse(input);
        const actorId = await getActorId();
        await updateRank(id, {
            name: data.name,
            grade: data.grade ?? null,
            abbreviation: data.abbreviation ?? null,
            rankLevel: data.rankLevel,
            order: data.order ?? null,
            nextRankId: data.nextRankId ?? null,
        }, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to update rank" };
    }
}

export async function deleteRankAction(id: number) {
    try {
        const actorId = await getActorId();
        await deleteRank(id, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete rank" };
    }
}
