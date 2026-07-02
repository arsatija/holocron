"use server";

import { db } from "@/db";
import { medals, trooperMedals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function getMedals() {
    try {
        return await db.query.medals.findMany({
            orderBy: (m, { asc }) => [asc(m.name)],
        });
    } catch (error) {
        console.error("Error fetching medals:", error);
        return [];
    }
}

export async function getMedalsByTrooperId(trooperId: string) {
    try {
        return await db.query.trooperMedals.findMany({
            where: eq(trooperMedals.trooperId, trooperId),
            with: { medal: true },
        });
    } catch (error) {
        console.error("Error fetching trooper medals:", error);
        return [];
    }
}

export async function awardMedal(trooperId: string, medalId: string) {
    const [row] = await db
        .insert(trooperMedals)
        .values({ trooperId, medalId })
        .returning();
    revalidateTag("trooper-medals");
    return row;
}

export async function revokeMedal(trooperId: string, medalId: string) {
    await db
        .delete(trooperMedals)
        .where(
            and(
                eq(trooperMedals.trooperId, trooperId),
                eq(trooperMedals.medalId, medalId),
            ),
        );
    revalidateTag("trooper-medals");
}

export type MedalInput = {
    name: string;
    description?: string | null;
    imageUrl: string;
};

export async function createMedal(data: MedalInput) {
    const [row] = await db.insert(medals).values(data).returning();
    revalidateTag("medals");
    return row;
}

export async function updateMedal(id: string, data: Partial<MedalInput>) {
    const [row] = await db
        .update(medals)
        .set(data)
        .where(eq(medals.id, id))
        .returning();
    revalidateTag("medals");
    return row;
}

export async function deleteMedal(id: string) {
    await db.delete(medals).where(eq(medals.id, id));
    revalidateTag("medals");
}
