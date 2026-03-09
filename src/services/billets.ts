"use server";

import { TrooperProfileBilletResponse } from "@/lib/types";
import { db } from "@/db";
import {
    billets,
    unitElements,
    billetAssignments,
    troopers,
    ranks,
    NewBilletAssignment,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { revalidateTag, unstable_noStore } from "next/cache";
import { createAuditLog } from "./audit";

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
                    id: troopers.id,
                    name: troopers.name,
                    numbers: troopers.numbers,
                    rankAbbr: ranks.abbreviation,
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
                .leftJoin(ranks, eq(troopers.rank, ranks.id))
                .where(eq(billets.id, billet.superiorBilletId))
                .limit(1);

            const row = superiorTrooperResult[0];
            superiorTrooper = row?.id
                ? { id: row.id, name: row.name ?? "", numbers: row.numbers ?? 0, rankAbbr: row.rankAbbr }
                : null;
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
        .orderBy(unitElements.priority, asc(billets.priority));

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

        return result[0] ?? null;
    } catch (error) {
        console.error(
            `Error fetching troopers billet with trooperId: ${trooperId}`,
            error
        );
        return null;
    }
}

export async function getTrooperBilletSlug(
    trooperId: string
): Promise<string | null> {
    unstable_noStore();
    try {
        const result = await db
            .select({ slug: billets.slug })
            .from(billetAssignments)
            .innerJoin(billets, eq(billetAssignments.billetId, billets.id))
            .where(eq(billetAssignments.trooperId, trooperId))
            .limit(1);

        return result[0]?.slug ?? null;
    } catch (error) {
        console.error(
            `Error fetching trooper billet slug with trooperId: ${trooperId}`,
            error
        );
        return null;
    }
}

export async function createBilletAssignment(
    billetAssignment: NewBilletAssignment,
    actorId?: string
) {
    try {
        // Todo: figure out how to make it so if a trooper has a billet while another one is being created, delete that old billet before linking the new one.

        // First try to find an existing assignment for this billet
        const result = await db.transaction(async (tx) => {
            const existingAssignmentByBillet = await tx
                .select()
                .from(billetAssignments)
                .where(
                    eq(billetAssignments.billetId, billetAssignment.billetId)
                );

            // Check if there's an existing assignment with the same trooperId
            const existingAssignmentByTrooper = await tx
                .select()
                .from(billetAssignments)
                .where(
                    eq(
                        billetAssignments.trooperId,
                        billetAssignment.trooperId ?? ""
                    )
                );

            // If there's an existing assignment with the same trooperId, delete it before creating a new one
            // Check if trooper already has this exact billet assignment
            const existingExactAssignment = existingAssignmentByTrooper.find(
                (assignment) =>
                    assignment.billetId === billetAssignment.billetId
            );

            if (existingExactAssignment) {
                // If trooper already has this exact billet, do nothing
                return;
            }

            // Delete any existing billet assignment for this trooper
            await removeBilletAssignment(billetAssignment.trooperId!);

            // Create the new billet assignment
            await tx.insert(billetAssignments).values(billetAssignment);
        });

        revalidateTag("billets");
        revalidateTag("orbat");

        const billetInfo = await db
            .select({ role: billets.role, unitName: unitElements.name })
            .from(billets)
            .leftJoin(unitElements, eq(billets.unitElementId, unitElements.id))
            .where(eq(billets.id, billetAssignment.billetId))
            .limit(1);
        const billetLabel = billetInfo[0]
            ? `${billetInfo[0].unitName ?? ""} ${billetInfo[0].role}`.trim()
            : undefined;

        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "billet_assignment",
            entityId: billetAssignment.billetId,
            entityLabel: billetLabel,
            targetTrooperId: billetAssignment.trooperId ?? null,
            newData: billetAssignment as unknown as Record<string, unknown>,
        });

        return { success: true };
    } catch (error) {
        return { error: "Failed to create billet assignment" };
    }
}

export async function removeBilletAssignment(trooperId: string, actorId?: string) {
    try {
        const previous = await db.query.billetAssignments.findFirst({
            where: eq(billetAssignments.trooperId, trooperId),
        });

        await db
            .delete(billetAssignments)
            .where(eq(billetAssignments.trooperId, trooperId));

        revalidateTag("billets");
        revalidateTag("orbat");

        if (previous) {
            const billetInfo = await db
                .select({ role: billets.role, unitName: unitElements.name })
                .from(billets)
                .leftJoin(unitElements, eq(billets.unitElementId, unitElements.id))
                .where(eq(billets.id, previous.billetId))
                .limit(1);
            const billetLabel = billetInfo[0]
                ? `${billetInfo[0].unitName ?? ""} ${billetInfo[0].role}`.trim()
                : undefined;

            await createAuditLog({
                actorId,
                action: "DELETE",
                entityType: "billet_assignment",
                entityId: previous.billetId,
                entityLabel: billetLabel,
                targetTrooperId: trooperId,
                previousData: previous as unknown as Record<string, unknown>,
            });
        }

        return { success: true };
    } catch (error) {
        return {
            error: `Failed to remove billet assignment for trooper: ${trooperId}`,
        };
    }
}
