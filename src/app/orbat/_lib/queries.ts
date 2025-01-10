import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
    billetAssignments,
    billets,
    Trooper,
    troopers,
    UnitElement,
    unitElements,
} from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { unstable_cache } from "@/lib/unstable-cache";

export interface OrbatElement {
    id: string;
    name: string;
    icon: string;
    parentId: string | null;
    priority: number;
}

export interface Trooper {
    id: string | null;
    numbers: number | null;
    name: string | null;
    rank: number | null;
}

interface OrbatBillet {
    id: string;
    role: string;
    priority: number;
}

export interface BilletWithTrooper {
    id: string;
    role: string;
    priority: number;
    trooper: Trooper | null;
}

export interface UnitElementWithBillets {
    id: string;
    icon: string;
    name: string;
    parentId: string | null;
    priority: number;
    billets: BilletWithTrooper[];
}

async function getBilletsWithTrooper(
    element: OrbatElement
): Promise<BilletWithTrooper[]> {
    const billets = await getBillets(element.id);
    const billetsWithTrooper: BilletWithTrooper[] = [];

    for (const billet of billets) {
        const trooper = await getBilltedTrooper(billet.id);
        billetsWithTrooper.push({
            id: billet.id,
            role: billet.role,
            priority: billet.priority,
            trooper: trooper,
        });
    }

    return billetsWithTrooper;
}

export async function getUnitElements(): Promise<OrbatElement[]> {
    const data = await db
        .select({
            id: unitElements.id,
            name: unitElements.name,
            icon: unitElements.icon,
            parentId: unitElements.parentId,
            priority: unitElements.priority,
        })
        .from(unitElements)
        .orderBy(unitElements.priority);

    return data;
}

async function getBillets(unitElementId: string): Promise<OrbatBillet[]> {
    const data = await db
        .select({
            id: billets.id,
            role: billets.role,
            priority: billets.priority,
        })
        .from(billets)
        .where(eq(billets.unitElementId, unitElementId))
        .orderBy(billets.priority);
    return data;
}

export async function getBilltedTrooper(
    billetId: string
): Promise<Trooper | null> {
    const data = await db
        .select({
            id: troopers.id,
            numbers: troopers.numbers,
            name: troopers.name,
            rank: troopers.rank,
        })
        .from(billetAssignments)
        .leftJoin(troopers, eq(billetAssignments.trooperId, troopers.id))
        .where(eq(billetAssignments.billetId, billetId))
        .then((rows) => (rows.length === 0 || rows[0].id === null ? [] : rows));

    if (data.length === 0) {
        return null;
    }

    return data[0];
}

export async function getOrbat(): Promise<StructuredOrbatElement[]> {
    try {
        return await unstable_cache(
            async () => {
                const uElements = await getUnitElements();

                const orbatData: UnitElementWithBillets[] = [];

                for (const element of uElements) {
                    orbatData.push({
                        id: element.id,
                        icon: element.icon,
                        name: element.name,
                        parentId: element.parentId,
                        priority: element.priority,
                        billets: await getBilletsWithTrooper(element),
                    });
                }

                const structuredOrbat = structureOrbat(orbatData);

                return structuredOrbat;
            },
            ["orbat"],
            {
                revalidate: 300,
                tags: ["orbat"],
            }
        )();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export interface StructuredOrbatElement {
    name: string;
    billets: {
        role: string;
        name: string;
        trooperId: string;
    }[];
    elements: StructuredOrbatElement[];
}

export function structureOrbat(
    flatOrbat: UnitElementWithBillets[]
): StructuredOrbatElement[] {
    const elementMap = new Map<string | null, UnitElementWithBillets[]>();

    // Group by parentId
    flatOrbat.forEach((element) => {
        const parentId = element.parentId ?? null;
        if (!elementMap.has(parentId)) {
            elementMap.set(parentId, []);
        }
        elementMap.get(parentId)?.push(element);
    });

    // Sort elements by priority within each group
    elementMap.forEach((elements) => {
        elements.sort((a, b) => a.priority - b.priority);
    });

    // Recursive function to build tree
    function buildTree(parentId: string | null): StructuredOrbatElement[] {
        const children = elementMap.get(parentId) || [];
        return children.map((element) => ({
            name: element.name,
            billets: element.billets
                .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                .map((billet) => ({
                    role: billet.role,
                    name: billet.trooper
                        ? getFullTrooperName(billet.trooper as Trooper)
                        : "N/A",
                    trooperId: billet.trooper?.id || "",
                })),
            elements: buildTree(element.id),
        }));
    }

    return buildTree(null);
}
