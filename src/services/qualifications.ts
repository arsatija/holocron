"use server";

import { db } from "@/db";
import { qualifications, trooperQualifications } from "@/db/schema";
import { unstable_cache } from "@/lib/unstable-cache";
import { eq } from "drizzle-orm";

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
        }
    )();
}

export async function getTrooperQualifications(trooperId: string) {
    const qualifications = await db.query.trooperQualifications.findMany({
        where: eq(trooperQualifications.trooperId, trooperId),
        columns: {
            qualificationId: true,
            earnedDate: true,
        },
    });
    return qualifications;
}
