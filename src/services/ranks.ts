"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ranks } from "@/db/schema";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";

export async function getRanks() {
    try {
        const ranks = (await db.query.ranks.findMany()).sort(
            (a, b) => (a.order ?? 9999) - (b.order ?? 9999)
        );

        return ranks;
    } catch (error) {
        console.error("Error fetching ranks:", error);
        return [];
    }
}

export async function getRanksAsOptions() {
    const ranks = await getRanks();

    const rankOptions = ranks.map((rank) => ({
        value: rank.id,
        label: rank.name,
    }));

    return rankOptions;
}

export async function getRank(rankId: number) {
    try {
        const data = await db.select().from(ranks).where(eq(ranks.id, rankId));

        return data[0];
    } catch (error) {
        console.error(`Error fetching rank with id: ${rankId} `, error);
        return null;
    }
}

export type RankInput = {
    grade?: string | null;
    name: string;
    abbreviation?: string | null;
    rankLevel: "Enlisted" | "JNCO" | "SNCO" | "Company" | "Command";
    order?: number | null;
    nextRankId?: number | null;
};

export async function createRank(input: RankInput, actorId?: string) {
    const [row] = await db.insert(ranks).values(input).returning();
    revalidateTag("ranks");
    await createAuditLog({
        actorId,
        action: "CREATE",
        entityType: "rank",
        entityId: String(row.id),
        entityLabel: row.name,
        newData: input as unknown as Record<string, unknown>,
    });
    return row;
}

export async function updateRank(id: number, input: Partial<RankInput>, actorId?: string) {
    const previous = await getRank(id);
    const [row] = await db.update(ranks).set(input).where(eq(ranks.id, id)).returning();
    revalidateTag("ranks");
    await createAuditLog({
        actorId,
        action: "UPDATE",
        entityType: "rank",
        entityId: String(id),
        entityLabel: row.name,
        previousData: previous as unknown as Record<string, unknown>,
        newData: input as unknown as Record<string, unknown>,
    });
    return row;
}

export async function deleteRank(id: number, actorId?: string) {
    const previous = await getRank(id);
    await db.delete(ranks).where(eq(ranks.id, id));
    revalidateTag("ranks");
    await createAuditLog({
        actorId,
        action: "DELETE",
        entityType: "rank",
        entityId: String(id),
        entityLabel: previous?.name ?? undefined,
        previousData: previous as unknown as Record<string, unknown>,
    });
}