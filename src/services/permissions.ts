"use server";

import { db } from "@/db";
import { billets, departmentPositions } from "@/db/schema";
import { eq } from "drizzle-orm";

// In-memory cache for hierarchy chains
// Cache structure: { slug: hierarchyChain[] }
const billetHierarchyCache = new Map<string, string[]>();
const positionHierarchyCache = new Map<string, string[]>();

/**
 * Get the full hierarchy chain for a billet slug
 * Returns array of slugs including the given billet and ALL subordinates
 * Example: If you are "cinder-1:lead", you get ["cinder-1:lead", "cinder-1-1:lead", "cinder-1-1:2ic", "cinder-1-2:lead", ...]
 * This allows superiors to access subordinate resources
 */
export async function getBilletHierarchyChain(
    billetSlug: string
): Promise<string[]> {
    // Check cache first
    if (billetHierarchyCache.has(billetSlug)) {
        return billetHierarchyCache.get(billetSlug)!;
    }

    try {
        const hierarchyChain: string[] = [billetSlug];

        // Find the billet with this slug
        const [billet] = await db
            .select({
                id: billets.id,
                slug: billets.slug,
                superiorBilletId: billets.superiorBilletId,
            })
            .from(billets)
            .where(eq(billets.slug, billetSlug))
            .limit(1);

        if (!billet) {
            console.warn(`Billet with slug "${billetSlug}" not found`);
            return hierarchyChain;
        }

        // Recursively find all subordinates
        await findSubordinateBillets(billet.id, hierarchyChain);

        // Cache the result
        billetHierarchyCache.set(billetSlug, hierarchyChain);

        return hierarchyChain;
    } catch (error) {
        console.error(
            `Error getting billet hierarchy for slug "${billetSlug}":`,
            error
        );
        return [billetSlug];
    }
}

/**
 * Recursively find all subordinate billets
 */
async function findSubordinateBillets(
    billetId: string,
    hierarchyChain: string[]
): Promise<void> {
    // Find all billets where this billet is their superior
    const subordinates = await db
        .select({
            id: billets.id,
            slug: billets.slug,
        })
        .from(billets)
        .where(eq(billets.superiorBilletId, billetId));

    for (const subordinate of subordinates) {
        if (subordinate.slug && !hierarchyChain.includes(subordinate.slug)) {
            hierarchyChain.push(subordinate.slug);
            // Recursively find subordinates of this subordinate
            await findSubordinateBillets(subordinate.id, hierarchyChain);
        }
    }
}

/**
 * Get the full hierarchy chain for a department position slug
 * Returns array of slugs including the given position and ALL subordinates
 * Example: If you are "training:lead", you get ["training:lead", "training-basic:lead", "training-basic:2ic", ...]
 * This allows superiors to access subordinate resources
 */
export async function getPositionHierarchyChain(
    positionSlug: string
): Promise<string[]> {
    // Check cache first
    if (positionHierarchyCache.has(positionSlug)) {
        return positionHierarchyCache.get(positionSlug)!;
    }

    try {
        const hierarchyChain: string[] = [positionSlug];

        // Find the position with this slug
        const [position] = await db
            .select({
                id: departmentPositions.id,
                slug: departmentPositions.slug,
                superiorPositionId: departmentPositions.superiorPositionId,
            })
            .from(departmentPositions)
            .where(eq(departmentPositions.slug, positionSlug))
            .limit(1);

        if (!position) {
            console.warn(`Position with slug "${positionSlug}" not found`);
            return hierarchyChain;
        }

        // Recursively find all subordinates
        await findSubordinatePositions(position.id, hierarchyChain);

        // Cache the result
        positionHierarchyCache.set(positionSlug, hierarchyChain);

        return hierarchyChain;
    } catch (error) {
        console.error(
            `Error getting position hierarchy for slug "${positionSlug}":`,
            error
        );
        return [positionSlug];
    }
}

/**
 * Recursively find all subordinate positions
 */
async function findSubordinatePositions(
    positionId: string,
    hierarchyChain: string[]
): Promise<void> {
    // Find all positions where this position is their superior
    const subordinates = await db
        .select({
            id: departmentPositions.id,
            slug: departmentPositions.slug,
        })
        .from(departmentPositions)
        .where(eq(departmentPositions.superiorPositionId, positionId));

    for (const subordinate of subordinates) {
        if (subordinate.slug && !hierarchyChain.includes(subordinate.slug)) {
            hierarchyChain.push(subordinate.slug);
            // Recursively find subordinates of this subordinate
            await findSubordinatePositions(subordinate.id, hierarchyChain);
        }
    }
}

/**
 * Clear the hierarchy caches
 * Call this when organizational structure changes
 */
export async function clearHierarchyCache() {
    billetHierarchyCache.clear();
    positionHierarchyCache.clear();
}
