import {db} from "@/db";
import { NewTrooper, Trooper, troopers} from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { eq } from "drizzle-orm";


export async function getTroopers(): Promise<Trooper[]> {
    const response = await db.query.troopers.findMany({where: eq(troopers.status, "Active")})

    return response;

}

export async function getTroopersAsOptions() {
    const troopers = await getTroopers();
    return troopers.map(trooper => ({
        label: getFullTrooperName(trooper),
        value: trooper.id
    }));
}


export async function createTrooper(trooper: NewTrooper) {
    const response = await db.insert(troopers).values(trooper);
    console.log(response);
    return response;
}

export async function updateTrooper(trooper: Trooper) {
    const response = await db.update(troopers).set(trooper).where(eq(troopers.id, trooper.id));
    console.log(response);
    return response;
}