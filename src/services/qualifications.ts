"use server";

import { db } from "@/db";
import { qualifications, trainingCompletions as trainings, trooperQualifications } from "@/db/schema";
import { unstable_cache } from "@/lib/unstable-cache";
import { and, arrayContains, eq } from "drizzle-orm";

export async function getQualifications() {
    try {
        return await unstable_cache(
            async () => {
                const quals = await db.query.qualifications.findMany({
                    columns: {
                        id: true,
                        name: true,
                        abbreviation: true,
                        category: true,
                    },
                });
                return quals;
            },
            ["qualifications"],
            {
                revalidate: 3600,
                tags: ["qualifications"],
            }
        )();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getQualificationOptions() {
    return await unstable_cache(
        async () => {
            try {
                const qualifications = await db.query.qualifications.findMany({
                    columns: {
                        id: true,
                        name: true,
                        abbreviation: true,
                        category: true,
                        rankRequirement: true,
                        description: true,
                    },
                });
                return qualifications;
            } catch (error) {
                console.error(
                    "Error getting qualifications as options:",
                    error
                );
                return [];
            }
        },
        ["qualifications-options"],
        {
            revalidate: 3600,
            tags: ["qualifications"],
        }
    )();
}

export async function getTrooperQualifications(trooperId: string) {
    const quals = await db.query.trooperQualifications.findMany({
        where: eq(trooperQualifications.trooperId, trooperId),
        columns: {
            qualificationId: true,
            earnedDate: true,
        },
    });

    const qualsWithTrainingId = await Promise.all(
        quals.map(async (qual) => {
            const training = await db.query.trainingCompletions.findFirst({
                where: and(
                    eq(trainings.qualificationId, qual.qualificationId),
                    arrayContains(trainings.traineeIds, [trooperId])
                ),
                columns: { id: true },
            });
            return {
                ...qual,
                trainingId: training?.id ?? null,
            };
        })
    );

    return qualsWithTrainingId;
}

/**
 * Returns qualification abbreviation strings (e.g. "qual:ZEUS") for use in the permission system.
 */
export async function getTrooperQualificationPermissions(trooperId: string): Promise<string[]> {
    const rows = await db
        .select({ abbreviation: qualifications.abbreviation })
        .from(trooperQualifications)
        .innerJoin(qualifications, eq(trooperQualifications.qualificationId, qualifications.id))
        .where(eq(trooperQualifications.trooperId, trooperId));

    return rows.map((r) => `qual:${r.abbreviation}`);
}

/**
 * Returns the distinct qualification categories a trooper holds (e.g. ["Zeus", "Medical"]).
 * Used for permission checks like checkPermissionsSync(ctx, ["qual:Zeus"]).
 */
export async function getTrooperQualificationCategories(trooperId: string): Promise<string[]> {
    const rows = await db
        .select({ category: qualifications.category })
        .from(trooperQualifications)
        .innerJoin(qualifications, eq(trooperQualifications.qualificationId, qualifications.id))
        .where(eq(trooperQualifications.trooperId, trooperId));

    return [...new Set(rows.map((r) => r.category))];
}
