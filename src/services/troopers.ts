"use server";

import { db } from "@/db";
import { NewTrooper, Rank, Trooper, troopers, User, users } from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { eq, not } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getRank } from "./ranks";
import { unstable_cache } from "@/lib/unstable-cache";

export async function getTroopers(): Promise<Trooper[]> {
    const response = await db.query.troopers.findMany({
        where: not(eq(troopers.status, "Discharged")),
    });

    return response;
}

export async function getAllTrooperDesignations(): Promise<{
    numbers: number[];
    names: string[];
}> {
    const response = await db.query.troopers.findMany({
        where: not(eq(troopers.status, "Discharged")),
        columns: { numbers: true, name: true },
    });

    const numbers = response.map((trooper) => trooper.numbers);
    const names = response.map((trooper) => trooper.name.toLowerCase());
    return { numbers, names };
}

// Trying unstable_cache in the try so if the result fails it doesnt cache a bad result allowing for it to rerun the request next time
export async function getTroopersAsOptions() {
    try {
        return await unstable_cache(
            async () => {
                const troopers = await getTroopers();
                return troopers.map((trooper) => ({
                    label: getFullTrooperName(trooper),
                    value: trooper.id,
                }));
            },
            ["troopers-as-options"],
            {
                revalidate: 300,
            }
        )();
    } catch (error) {
        console.error("Failed to get troopers as options:", error);
        return [];
    }
}

export async function createTrooper(trooper: NewTrooper) {
    try {
        const response = await db
            .insert(troopers)
            .values(trooper)
            .onConflictDoUpdate({
                target: troopers.id,
                set: trooper,
            })
            .returning();

        revalidateTag("troopers");
        revalidateTag("troopers-status-counts");
        revalidateTag("orbat");
        revalidateTag("billets");

        return response[0] ?? null;
    } catch (error) {
        console.error("Failed to create trooper:", error);
        return null;
    }
}

export async function updateTrooper(trooper: NewTrooper) {
    try {
        console.log("updateTrooper: ", trooper);
        const response = await db
            .update(troopers)
            .set(trooper)
            .where(eq(troopers.id, trooper.id!))
            .returning();

        revalidateTag("troopers");
        revalidateTag("troopers-status-counts");
        revalidateTag("orbat");
        revalidateTag("billets");

        return response[0] ?? null;
    } catch (error) {
        console.error("Failed to update trooper:", error);
        return null;
    }
}

export async function deleteTrooper(trooperId: string) {
    try {
        await db.delete(troopers).where(eq(troopers.id, trooperId));

        revalidateTag("troopers");
        revalidateTag("troopers-status-counts");
        revalidateTag("orbat");
        revalidateTag("billets");

        return { success: true };
    } catch (error) {
        return { error: `Failed to delete trooper: ${trooperId}` };
    }
}

export async function getTrooper(trooperId: string): Promise<Trooper | null> {
    try {
        const data = await db
            .select()
            .from(troopers)
            .where(eq(troopers.id, trooperId));

        return data[0];
    } catch (error) {
        console.error(`Error fetching trooper with id: ${trooperId} `, error);
        return null;
    }
}

export async function getTrooperRank(trooperId: string): Promise<Rank | null> {
    try {
        const trooper = await getTrooper(trooperId);
        if (!trooper?.rank) return null;

        const rank = await getRank(trooper.rank);
        return rank;
    } catch (error) {
        console.error(`Error fetching rank for trooper: ${trooperId}`, error);
        return null;
    }
}

export async function getTrooperAccount(
    trooperId: string
): Promise<User | null> {
    const user = await db
        .select()
        .from(users)
        .where(eq(users.trooperId, trooperId));
    return user[0] ?? null;
}
