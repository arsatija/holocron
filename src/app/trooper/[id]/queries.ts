"use server";

import { db } from "@/db";
import {
    Player,
    players,
    billets,
    billetAssignments,
    ranks,
    playerQualifications,
} from "@/db/schema";
import { playerQualificationsResponse, TrooperProfileBilletResponse } from "@/lib/types";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function getTrooper(trooperId: string): Promise<Player | null> {
    try {
        const data = await db
            .select()
            .from(players)
            .where(eq(players.id, trooperId));

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

export async function getPlayerQualifications(trooperId: string): Promise<playerQualificationsResponse[]> {
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

export async function getBilletInformation(
    trooperId: string
): Promise<TrooperProfileBilletResponse | null> {
    try {
        // const billets = alias(billets, "billets");
        const superiorBillets = alias(billets, "superior_billets");
        const superiorPlayers = alias(players, "superior_players");
        const superiorAssignments = alias(
            billetAssignments,
            "superior_assignment"
        );

        const result = await db
            .select({
                billet: billets,
                superiorBillet: superiorBillets,
                superiorTrooper: superiorPlayers,
            })
            .from(billetAssignments)
            .innerJoin(billets, eq(billetAssignments.billetId, billets.id))
            .innerJoin(players, eq(billetAssignments.trooperId, players.id))
            .leftJoin(
                superiorBillets,
                eq(billets.superiorBilletId, superiorBillets.id)
            )
            .leftJoin(
                superiorAssignments,
                eq(superiorBillets.id, superiorAssignments.billetId)
            )
            .leftJoin(
                superiorPlayers,
                eq(superiorAssignments.trooperId, superiorPlayers.id)
            )
            .where(eq(players.id, trooperId));

        if (result.length == 0) return null;

        return result[0];
    } catch (error) {
        console.error(
            `Error fetching billet informsation with trooperId: ${trooperId} `,
            error
        );
        return null;
    }
}
