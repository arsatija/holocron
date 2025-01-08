import { db } from "@/db"
import { players } from "@/db/schema";

export async function getTrooper(trooperId: string) {
    const data = await db.select().from(players)

    return data[0];
}

export const revalidate = 3600;