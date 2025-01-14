import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ranks } from "@/db/schema";

export async function getRanks() {
    try {
        const ranks = (await db.query.ranks.findMany()).sort(
            (a, b) => a.id - b.id
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