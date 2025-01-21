import { db } from "@/db";
import { departments, departmentAssignments, departmentPositions, billetAssignments } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

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
        .leftJoin(departments, eq(departmentPositions.departmentId, departments.id))
        .leftJoin(departmentAssignments, eq(departmentPositions.id, departmentAssignments.departmentPositionId))
        .orderBy(departments.priority, asc(departmentPositions.priority));

    return result;
}
