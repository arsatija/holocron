"use server";

import { db } from "@/db";
import {
    Trooper,
    troopers,
    billets,
    billetAssignments,
    ranks,
    playerQualifications,
    unitElements,
} from "@/db/schema";
import {
    playerQualificationsResponse,
    TrooperProfileBilletResponse,
} from "@/lib/types";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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

export async function getRank(rankId: number) {
    try {
        const data = await db.select().from(ranks).where(eq(ranks.id, rankId));

        return data[0];
    } catch (error) {
        console.error(`Error fetching rank with id: ${rankId} `, error);
        return null;
    }
}

export async function getPlayerQualifications(
    trooperId: string
): Promise<playerQualificationsResponse[]> {
    try {
        const data = await db
            .select({
                qualificationId: playerQualifications.qualificationId,
                earnedDate: playerQualifications.earnedDate,
            })
            .from(playerQualifications)
            .where(eq(playerQualifications.playerId, trooperId));

        return data;
    } catch (error) {
        console.error(
            `Error fetching qualifications with id: ${trooperId} `,
            error
        );
        return [];
    }
}