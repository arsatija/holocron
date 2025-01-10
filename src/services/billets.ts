import { TrooperProfileBilletResponse } from "@/lib/types";
import { db } from "@/db";
import { billets, unitElements, billetAssignments, troopers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getBilletInformation(
    trooperId: string
): Promise<TrooperProfileBilletResponse | null> {
    try {
        // First get the billet and unit element info
        const billetResult = await db
            .select({
                billet: billets,
                unitElement: unitElements,
            })
            .from(billetAssignments)
            .innerJoin(billets, eq(billetAssignments.billetId, billets.id))
            .leftJoin(unitElements, eq(billets.unitElementId, unitElements.id))
            .where(eq(billetAssignments.trooperId, trooperId))
            .limit(1);

        if (billetResult.length === 0 || !billetResult[0].unitElement)
            return null;

        const { billet, unitElement } = billetResult[0] ?? { billet: null };

        let superiorTrooper = null;

        // If there's a superior billet, get that info
        if (billet.superiorBilletId) {
            const superiorTrooperResult = await db
                .select({
                    superiorTrooper: troopers,
                })
                .from(billets)
                .leftJoin(
                    billetAssignments,
                    eq(billets.id, billetAssignments.billetId)
                )
                .leftJoin(troopers, eq(billetAssignments.trooperId, troopers.id))
                .where(eq(billets.id, billet.superiorBilletId))
                .limit(1);

            superiorTrooper = superiorTrooperResult[0].superiorTrooper ?? null;
        }

        return {
            billet,
            unitElement: unitElement!,
            superiorTrooper,
        };
    } catch (error) {
        console.error(
            `Error fetching billet information with trooperId: ${trooperId}`,
            error
        );
        return null;
    }
}
