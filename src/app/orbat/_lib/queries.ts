import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
    billetAssignments,
    billets,
    Trooper,
    troopers,
    UnitElement,
    unitElements,
    departments,
    departmentPositions,
    departmentAssignments,
} from "@/db/schema";
import { getFullTrooperName, getShortTrooperName } from "@/lib/utils";
import { unstable_cache } from "@/lib/unstable-cache";

export interface OrbatElement {
    id: string;
    name: string;
    icon: string;
    parentId: string | null;
    priority: number;
}

export interface OrbatTrooper {
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
    trooper: OrbatTrooper | null;
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
): Promise<OrbatTrooper | null> {
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
                        ? getShortTrooperName(billet.trooper as Trooper)
                        : "---",
                    trooperId: billet.trooper?.id || "",
                })),
            elements: buildTree(element.id),
        }));
    }

    return buildTree(null);
}

export interface DepartmentElement {
    id: string;
    name: string;
    icon: string;
    parentId: string | null;
    priority: number;
}

export interface DepartmentPosition {
    id: string;
    role: string;
    priority: number;
}

export interface PositionWithTrooper {
    id: string;
    role: string;
    priority: number;
    trooper: OrbatTrooper | null;
}

export interface DepartmentWithPositions {
    id: string;
    icon: string;
    name: string;
    parentId: string | null;
    priority: number;
    positions: PositionWithTrooper[];
}

async function getDepartmentPositionsWithTrooper(
    department: DepartmentElement
): Promise<PositionWithTrooper[]> {
    const positions = await getDepartmentPositions(department.id);
    const positionsWithTrooper: PositionWithTrooper[] = [];

    for (const position of positions) {
        const trooper = await getAssignedTrooper(position.id);
        positionsWithTrooper.push({
            id: position.id,
            role: position.role,
            priority: position.priority,
            trooper: trooper,
        });
    }

    return positionsWithTrooper;
}

async function getDepartments(): Promise<DepartmentElement[]> {
    const data = await db
        .select({
            id: departments.id,
            name: departments.name,
            icon: departments.icon,
            parentId: departments.parentId,
            priority: departments.priority,
        })
        .from(departments)
        .orderBy(departments.priority);

    return data;
}

async function getDepartmentPositions(departmentId: string): Promise<DepartmentPosition[]> {
    const data = await db
        .select({
            id: departmentPositions.id,
            role: departmentPositions.role,
            priority: departmentPositions.priority,
        })
        .from(departmentPositions)
        .where(eq(departmentPositions.departmentId, departmentId))
        .orderBy(departmentPositions.priority);
    return data;
}

async function getAssignedTrooper(
    positionId: string
): Promise<OrbatTrooper | null> {
    const data = await db
        .select({
            id: troopers.id,
            numbers: troopers.numbers,
            name: troopers.name,
            rank: troopers.rank,
        })
        .from(departmentAssignments)
        .leftJoin(troopers, eq(departmentAssignments.trooperId, troopers.id))
        .where(eq(departmentAssignments.departmentPositionId, positionId))
        .then((rows) => (rows.length === 0 || rows[0].id === null ? [] : rows));

    if (data.length === 0) {
        return null;
    }

    return data[0];
}

export async function getDepartmentOrbat(): Promise<StructuredOrbatElement[]> {
    try {
        return await unstable_cache(
            async () => {
                const dElements = await getDepartments();

                const orbatData: DepartmentWithPositions[] = [];

                for (const element of dElements) {
                    orbatData.push({
                        id: element.id,
                        icon: element.icon,
                        name: element.name,
                        parentId: element.parentId,
                        priority: element.priority,
                        positions: await getDepartmentPositionsWithTrooper(element),
                    });
                }

                const structuredOrbat = structureDepartmentOrbat(orbatData);

                return structuredOrbat;
            },
            ["department-orbat"],
            {
                revalidate: 300,
                tags: ["department-orbat"],
            }
        )();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export function structureDepartmentOrbat(
    flatOrbat: DepartmentWithPositions[]
): StructuredOrbatElement[] {
    const elementMap = new Map<string | null, DepartmentWithPositions[]>();

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
            billets: element.positions
                .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                .map((position) => ({
                    role: position.role,
                    name: position.trooper
                        ? getShortTrooperName(position.trooper as Trooper)
                        : "---",
                    trooperId: position.trooper?.id || "",
                })),
            elements: buildTree(element.id),
        }));
    }

    return buildTree(null);
}
