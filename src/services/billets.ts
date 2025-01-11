import { TrooperProfileBilletResponse } from "@/lib/types";
import { db } from "@/db";
import {
    billets,
    unitElements,
    billetAssignments,
    troopers,
    NewBilletAssignment,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag, unstable_noStore } from "next/cache";

export async function getBilletInformation(
    trooperId: string
): Promise<TrooperProfileBilletResponse | null> {
    unstable_noStore();
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
                .leftJoin(
                    troopers,
                    eq(billetAssignments.trooperId, troopers.id)
                )
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

export async function getBillets() {
    const result = await db
        .select({
            id: billets.id,
            role: billets.role,
            unitElementId: billets.unitElementId,
            unitElementName: unitElements.name,
            trooperId: billetAssignments.trooperId,
        })
        .from(billets)
        .leftJoin(unitElements, eq(billets.unitElementId, unitElements.id))
        .leftJoin(billetAssignments, eq(billets.id, billetAssignments.billetId))
        .orderBy(unitElements.priority, billets.priority);

    return result;
}

export async function getBilletsByUnitElement(unitElementId: string) {
    const result = await db
        .select({
            id: billets.id,
            role: billets.role,
            unitElementId: billets.unitElementId,
            unitElementName: unitElements.name,
            trooperId: billetAssignments.trooperId,
        })
        .from(billets)
        .leftJoin(unitElements, eq(billets.unitElementId, unitElements.id))
        .leftJoin(billetAssignments, eq(billets.id, billetAssignments.billetId))
        .orderBy(unitElements.priority, billets.priority)
        .where(eq(billets.unitElementId, unitElementId));

    return result;
}

export async function getAvailableBilletOptions(trooperId?: string) {
    const billets = await getBillets();

    const availableBillets = billets.filter(
        (billet) =>
            billet.trooperId === null ||
            (trooperId && billet.trooperId === trooperId)
    );
    const availableBilletOptions = availableBillets.map((billet) => ({
        value: billet.id,
        label: `${billet.unitElementName} ${billet.role}`,
    }));

    return availableBilletOptions.sort((a, b) =>
        a.label.localeCompare(b.label)
    );
}

export async function getTroopersBillet(trooperId: string) {
    unstable_noStore();
    try {
        const result = await db
            .select({ billetId: billetAssignments.billetId })
            .from(billetAssignments)
            .where(eq(billetAssignments.trooperId, trooperId));

        return result[0]?.billetId ?? null;
    } catch (error) {
        console.error(
            `Error fetching troopers billet with trooperId: ${trooperId}`,
            error
        );
        return null;
    }
}

export async function createBilletAssignment(
    billetAssignment: NewBilletAssignment
) {
    try {
        // Todo: figure out how to make it so if a trooper has a billet while another one is being created, delete that old billet before linking the new one.

        // First try to find an existing assignment for this billet
        const result = await db.transaction(async (tx) => {
            const existingAssignment = await tx
                .select()
                .from(billetAssignments)
                .where(
                    eq(billetAssignments.billetId, billetAssignment.billetId)
                );

            console.log("existingAssignment: ", existingAssignment);

            if (existingAssignment.length > 0) {
                // If there's an existing assignment with null trooperId, update it
                if (existingAssignment[0].trooperId === null) {
                    const result = await tx
                        .update(billetAssignments)
                        .set({
                            trooperId: billetAssignment.trooperId,
                        })
                        .where(
                            eq(
                                billetAssignments.billetId,
                                billetAssignment.billetId
                            )
                        )
                        .returning();

                    console.log("result: ", result);
                    return { success: true };
                }
                // If there's an existing assignment with a different trooperId, do nothing
                return { error: "Billet already assigned" };
            } else {
                // If no existing assignment, create a new one
                await tx.insert(billetAssignments).values(billetAssignment);
                return { success: true };
            }
        });

        return result;
    } catch (error) {
        return { error: "Failed to create billet assignment" };
    }
}

export async function removeBilletAssignment(trooperId: string) {
    try {
        await db
            .delete(billetAssignments)
            .where(eq(billetAssignments.trooperId, trooperId));

        revalidateTag("billets");
        revalidateTag("orbat");

        return { success: true };
    } catch (error) {
        return {
            error: `Failed to remove billet assignment for trooper: ${trooperId}`,
        };
    }
}
