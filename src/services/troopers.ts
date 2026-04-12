"use server";

import { db } from "@/db";
import { NewTrooper, Rank, Trooper, troopers, ranks, User, users, trooperBios } from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { asc, eq, not } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getRank } from "./ranks";
import { unstable_cache } from "@/lib/unstable-cache";
import { createAuditLog } from "./audit";

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
                const results = await db
                    .select({
                        id: troopers.id,
                        name: troopers.name,
                        numbers: troopers.numbers,
                        rankAbbr: ranks.abbreviation,
                    })
                    .from(troopers)
                    .leftJoin(ranks, eq(troopers.rank, ranks.id))
                    .where(not(eq(troopers.status, "Discharged")))
                    .orderBy(asc(troopers.numbers));
                return results.map((trooper) => ({
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

export async function createTrooper(trooper: NewTrooper, actorId?: string) {
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

        const created = response[0] ?? null;
        if (created) {
            await createAuditLog({
                actorId,
                action: "CREATE",
                entityType: "trooper",
                entityId: created.id,
                entityLabel: `${created.numbers} ${created.name}`,
                targetTrooperId: created.id,
                newData: created as unknown as Record<string, unknown>,
            });
        }

        return created;
    } catch (error) {
        console.error("Failed to create trooper:", error);
        return null;
    }
}

export async function updateTrooper(trooper: NewTrooper, actorId?: string) {
    try {
        console.log("updateTrooper: ", trooper);

        const previous = await getTrooper(trooper.id!);

        const response = await db
            .update(troopers)
            .set(trooper)
            .where(eq(troopers.id, trooper.id!))
            .returning();

        revalidateTag("troopers");
        revalidateTag("troopers-status-counts");
        revalidateTag("orbat");
        revalidateTag("billets");

        const updated = response[0] ?? null;
        if (updated && previous) {
            const rankChanged = previous.rank !== updated.rank;
            const nonRankFields = (["status", "numbers", "name", "referredBy", "recruitedBy", "recruitmentDate", "rankChangedDate", "bio", "attendances"] as const);
            const otherFieldChanged = nonRankFields.some((k) => previous[k] !== updated[k]);

            const trooperLabel = `${updated.numbers} ${updated.name}`;

            if (otherFieldChanged) {
                await createAuditLog({
                    actorId,
                    action: "UPDATE",
                    entityType: "trooper",
                    entityId: updated.id,
                    entityLabel: trooperLabel,
                    targetTrooperId: updated.id,
                    previousData: previous as unknown as Record<string, unknown>,
                    newData: updated as unknown as Record<string, unknown>,
                });
            }

            if (rankChanged) {
                await createAuditLog({
                    actorId,
                    action: "UPDATE",
                    entityType: "trooper_rank",
                    entityId: updated.id,
                    entityLabel: trooperLabel,
                    targetTrooperId: updated.id,
                    previousData: { rank: previous.rank },
                    newData: { rank: updated.rank },
                });
            }
        }

        return updated;
    } catch (error) {
        console.error("Failed to update trooper:", error);
        return null;
    }
}

export async function deleteTrooper(trooperId: string, actorId?: string) {
    try {
        const previous = await getTrooper(trooperId);

        await db.delete(troopers).where(eq(troopers.id, trooperId));

        revalidateTag("troopers");
        revalidateTag("troopers-status-counts");
        revalidateTag("orbat");
        revalidateTag("billets");

        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "trooper",
            entityId: trooperId,
            entityLabel: previous ? `${previous.numbers} ${previous.name}` : undefined,
            previousData: previous as unknown as Record<string, unknown>,
        });

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

export async function updateTrooperBio(trooperId: string, bio: string) {
    try {
        await db
            .update(troopers)
            .set({ bio })
            .where(eq(troopers.id, trooperId));
        revalidateTag("troopers");
        return { success: true };
    } catch (error) {
        console.error(`Failed to update bio for trooper: ${trooperId}`, error);
        return { error: "Failed to update bio" };
    }
}

export async function submitBioDraft(
    trooperId: string,
    content: string,
    submittedById: string,
    currentBio: string | null
) {
    try {
        // Replace any existing pending draft for this trooper
        const existing = await db.query.trooperBios.findFirst({
            where: (b, { and, eq }) => and(eq(b.trooperId, trooperId), eq(b.status, "pending")),
        });

        if (existing) {
            await db
                .update(trooperBios)
                .set({ content, previousContent: currentBio, submittedById, submittedAt: new Date() })
                .where(eq(trooperBios.id, existing.id));
            return { success: true, id: existing.id };
        }

        const [row] = await db
            .insert(trooperBios)
            .values({ trooperId, content, previousContent: currentBio, submittedById })
            .returning();

        const subject = await getTrooper(trooperId);
        await createAuditLog({
            actorId: submittedById,
            action: "CREATE",
            entityType: "trooper_bio",
            entityId: row.id,
            entityLabel: subject ? `${subject.numbers} ${subject.name} — Bio Submission` : undefined,
            targetTrooperId: trooperId,
            newData: { trooperId, content },
        });

        return { success: true, id: row.id };
    } catch (error) {
        console.error(`Failed to submit bio draft for trooper: ${trooperId}`, error);
        return { error: "Failed to submit bio draft" };
    }
}

export async function getPendingBioDraft(trooperId: string) {
    try {
        return await db.query.trooperBios.findFirst({
            where: (b, { and, eq }) => and(eq(b.trooperId, trooperId), eq(b.status, "pending")),
        }) ?? null;
    } catch {
        return null;
    }
}

export async function approveBioDraft(bioId: string, approvedById: string) {
    try {
        const draft = await db.query.trooperBios.findFirst({
            where: eq(trooperBios.id, bioId),
        });
        if (!draft || draft.status !== "pending") return { error: "Draft not found or not pending" };

        await db.transaction(async (tx) => {
            await tx.update(troopers).set({ bio: draft.content }).where(eq(troopers.id, draft.trooperId));
            await tx.update(trooperBios).set({ status: "approved", approvedById, approvedAt: new Date() }).where(eq(trooperBios.id, bioId));
        });

        revalidateTag("troopers");

        const subject = await getTrooper(draft.trooperId);
        await createAuditLog({
            actorId: approvedById,
            action: "UPDATE",
            entityType: "trooper_bio",
            entityId: bioId,
            entityLabel: subject ? `${subject.numbers} ${subject.name} — Bio Approved` : undefined,
            targetTrooperId: draft.trooperId,
            previousData: { status: "pending" },
            newData: { status: "approved" },
        });

        return { success: true };
    } catch (error) {
        console.error(`Failed to approve bio draft: ${bioId}`, error);
        return { error: "Failed to approve bio draft" };
    }
}

export async function rejectBioDraft(bioId: string, approvedById: string) {
    try {
        const draft = await db.query.trooperBios.findFirst({ where: eq(trooperBios.id, bioId) });

        await db
            .update(trooperBios)
            .set({ status: "rejected", approvedById, approvedAt: new Date() })
            .where(eq(trooperBios.id, bioId));

        const subject = draft?.trooperId ? await getTrooper(draft.trooperId) : null;
        await createAuditLog({
            actorId: approvedById,
            action: "UPDATE",
            entityType: "trooper_bio",
            entityId: bioId,
            entityLabel: subject ? `${subject.numbers} ${subject.name} — Bio Rejected` : undefined,
            targetTrooperId: draft?.trooperId ?? null,
            previousData: { status: "pending" },
            newData: { status: "rejected" },
        });

        return { success: true };
    } catch (error) {
        console.error(`Failed to reject bio draft: ${bioId}`, error);
        return { error: "Failed to reject bio draft" };
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
