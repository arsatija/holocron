"use server";

import { db } from "@/db";
import {
    departments,
    departmentPositions,
    departmentAssignments,
} from "@/db/schema";
import { eq, asc, and, inArray } from "drizzle-orm";
import { revalidateTag, unstable_noStore } from "next/cache";

export async function getDepartmentList() {
    const data = await db.query.departmentPositions.findMany({
        columns: {
            id: true,
            role: true,
        },
    });

    const departmentList = data.map((department) => ({
        value: department.id,
        label: department.role,
    }));

    return departmentList;
}

export async function getAvailableDepartmentOptions(trooperId?: string) {
    const positions = await getDepartmentPositions();

    const availablePositions = positions.filter(
        (position) =>
            position.trooperId === null ||
            (trooperId && position.trooperId === trooperId)
    );
    const availablePositionOptions = availablePositions.map((position) => ({
        value: position.id,
        label: `${position.unitElementName} ${position.role}`,
    }));

    return availablePositionOptions.sort((a, b) =>
        a.label.localeCompare(b.label)
    );
}

export async function getDepartmentPositions() {
    const result = await db
        .select({
            id: departmentPositions.id,
            role: departmentPositions.role,
            departmentId: departmentPositions.departmentId,
            unitElementName: departments.name,
            trooperId: departmentAssignments.trooperId,
        })
        .from(departmentPositions)
        .leftJoin(
            departments,
            eq(departmentPositions.departmentId, departments.id)
        )
        .leftJoin(
            departmentAssignments,
            eq(
                departmentPositions.id,
                departmentAssignments.departmentPositionId
            )
        )
        .orderBy(departments.priority, asc(departmentPositions.priority));

    return result;
}

export async function getTroopersDepartmentPositions(trooperId: string) {
    unstable_noStore();
    try {
        const result = await db
            .select({ positionId: departmentAssignments.departmentPositionId })
            .from(departmentAssignments)
            .where(eq(departmentAssignments.trooperId, trooperId));

        return result;
    } catch (error) {
        console.error(
            `Error fetching troopers department positions with trooperId: ${trooperId}`,
            error
        );
        return null;
    }
}

export async function getTrooperPositionSlugs(
    trooperId: string
): Promise<string[]> {
    unstable_noStore();
    try {
        const result = await db
            .select({ slug: departmentPositions.slug })
            .from(departmentAssignments)
            .innerJoin(
                departmentPositions,
                eq(
                    departmentAssignments.departmentPositionId,
                    departmentPositions.id
                )
            )
            .where(eq(departmentAssignments.trooperId, trooperId));

        // Filter out null slugs and return only valid slugs
        return result
            .map((r) => r.slug)
            .filter((slug): slug is string => slug !== null);
    } catch (error) {
        console.error(
            `Error fetching trooper position slugs with trooperId: ${trooperId}`,
            error
        );
        return [];
    }
}

export async function getTopLevelDepartment(departmentPositionId: string) {
    // First, get the department for this position

    const result = await db.transaction(async (tx) => {
        const [position] = await tx
            .select()
            .from(departmentPositions)
            .where(eq(departmentPositions.id, departmentPositionId))
            .innerJoin(
                departments,
                eq(departments.id, departmentPositions.departmentId)
            );

        if (!position?.departments) {
            return null;
        }

        let currentDepartment = position.departments;

        // Keep traversing up until we find a department with no parent
        while (currentDepartment.parentId) {
            const parentDepartment = await db.query.departments.findFirst({
                where: eq(departments.id, currentDepartment.parentId),
            });

            if (!parentDepartment) {
                break;
            }

            currentDepartment = parentDepartment;
        }

        return currentDepartment;
    });

    return result;
}

export async function getTrooperTopLevelDepartment(trooperId: string) {
    const [assignment] = await db
        .select()
        .from(departmentAssignments)
        .where(eq(departmentAssignments.trooperId, trooperId))
        .innerJoin(
            departmentPositions,
            eq(
                departmentPositions.id,
                departmentAssignments.departmentPositionId
            )
        );

    if (!assignment?.department_positions?.id) {
        return null;
    }

    return getTopLevelDepartment(assignment.department_positions.id);
}

export async function addDepartmentsToTrooper(
    trooperId: string,
    departmentIds: string[]
) {
    try {
        const result = await db.insert(departmentAssignments).values(
            departmentIds.map((departmentId) => ({
                trooperId,
                departmentPositionId: departmentId,
            }))
        );

        revalidateTag("department-orbat");
        return true;
    } catch (error) {
        console.error(
            `Error adding departments to trooper with trooperId: ${trooperId}`,
            error
        );
        return false;
    }
}

export async function removeDepartmentsFromTrooper(
    trooperId: string,
    departmentIds: string[]
) {
    try {
        const result = await db
            .delete(departmentAssignments)
            .where(
                and(
                    eq(departmentAssignments.trooperId, trooperId),
                    inArray(
                        departmentAssignments.departmentPositionId,
                        departmentIds
                    )
                )
            );
        revalidateTag("department-orbat");
        return true;
    } catch (error) {
        console.error(
            `Error removing departments from trooper with trooperId: ${trooperId}`,
            error
        );
        return false;
    }
}

export async function getTrooperDepartments(trooperId: string) {
    try {
        const result = await db
            .select()
            .from(departmentAssignments)
            .where(eq(departmentAssignments.trooperId, trooperId))
            .innerJoin(
                departmentPositions,
                eq(
                    departmentPositions.id,
                    departmentAssignments.departmentPositionId
                )
            )
            .innerJoin(
                departments,
                eq(departments.id, departmentPositions.departmentId)
            );

        const depts = result.map((department) => department.departments);
        return depts;
    } catch (error) {
        console.error(
            `Error fetching trooper departments with trooperId: ${trooperId}`,
            error
        );
        return [];
    }
}
