"use server"

import {db} from "@/db";
import { NewTrooper, Trooper, troopers} from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { eq, not } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function getTroopers(): Promise<Trooper[]> {
    const response = await db.query.troopers.findMany({
        where: eq(troopers.status, "Active"),
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

export async function getTroopersAsOptions() {
    const troopers = await getTroopers();
    return troopers.map((trooper) => ({
        label: getFullTrooperName(trooper),
        value: trooper.id,
    }));
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

