import { db } from "@/db";

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
