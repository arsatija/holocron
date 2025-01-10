"use server"

import {db} from "@/db";
import { NewTrooper, Trooper, troopers} from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { eq, not } from "drizzle-orm";


export async function getTroopers(): Promise<Trooper[]> {
    const response = await db.query.troopers.findMany({where: eq(troopers.status, "Active")})

    return response;
}

export async function getAllTrooperDesignations(): Promise<{numbers: number[], names: string[]}> {
    const response = await db.query.troopers.findMany({where: not(eq(troopers.status, "Discharged")), columns: {numbers: true, name: true}})

    const numbers = response.map(trooper => trooper.numbers);
    const names = response.map(trooper => trooper.name);
    return { numbers, names };
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