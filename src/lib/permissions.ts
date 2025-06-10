import { db } from "@/db";
import {
    wikiCollectionPermissions,
    wikiPagePermissions,
    wikiPages,
    wikiCollections,
    ranks,
    departmentAssignments,
    departmentPositions,
    permissionAction,
    users,
} from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";

type PermissionCheck = {
    hasAccess: boolean;
    reason?: string;
};

type DepartmentAssignment = {
    departmentPosition: {
        id: number;
        department: {
            id: number;
        };
    };
};

async function checkPermissionRequirements(
    permissions: (
        | typeof wikiCollectionPermissions.$inferSelect
        | typeof wikiPagePermissions.$inferSelect
    )[],
    user: any,
    action: "view" | "edit"
): Promise<PermissionCheck> {
    // Filter permissions for the requested action
    const relevantPermissions = permissions.filter((p) => p.action === action);

    if (relevantPermissions.length === 0) {
        return { hasAccess: action === "view" }; // Default to public view, no edit
    }

    // Group permissions by type
    const rankPermissions = relevantPermissions.filter(
        (p) => p.type === "rank"
    );
    const departmentPermissions = relevantPermissions.filter(
        (p) => p.type === "department"
    );
    const positionPermissions = relevantPermissions.filter(
        (p) => p.type === "position"
    );

    // Check rank requirements
    if (rankPermissions.length > 0) {
        const requiredRanks = await db.query.ranks.findMany({
            where: inArray(
                ranks.id,
                rankPermissions.map((p) => parseInt(p.value))
            ),
        });

        const meetsRankRequirement = requiredRanks.some(
            (rank) => user.trooper.rank >= rank.id
        );

        if (meetsRankRequirement) {
            return { hasAccess: true };
        }
    }

    // Check department requirements
    if (departmentPermissions.length > 0) {
        const userDepartments = user.trooper.departmentAssignments.map(
            (da: DepartmentAssignment) => da.departmentPosition.department.id
        );

        const meetsDepartmentRequirement = departmentPermissions.some((p) =>
            userDepartments.includes(p.value)
        );

        if (meetsDepartmentRequirement) {
            return { hasAccess: true };
        }
    }

    // Check position requirements
    if (positionPermissions.length > 0) {
        const userPositions = user.trooper.departmentAssignments.map(
            (da: DepartmentAssignment) => da.departmentPosition.id
        );

        const meetsPositionRequirement = positionPermissions.some((p) =>
            userPositions.includes(p.value)
        );

        if (meetsPositionRequirement) {
            return { hasAccess: true };
        }
    }

    // If we get here, the user doesn't meet any of the permission requirements
    return {
        hasAccess: false,
        reason: `You need to meet at least one of the ${action} requirements`,
    };
}

export async function checkWikiPageAccess(
    userId: string,
    pageId: string,
    action: "view" | "edit" = "view"
): Promise<PermissionCheck> {
    // Get the page and its collection
    const page = await db.query.wikiPages.findFirst({
        where: eq(wikiPages.id, pageId),
        with: {
            collection: true,
        },
    });

    if (!page) {
        return { hasAccess: false, reason: "Page not found" };
    }

    // Get user's rank and departments
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
            trooper: {
                with: {
                    rank: true,
                    departmentAssignments: {
                        with: {
                            departmentPosition: {
                                with: {
                                    department: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user?.trooper) {
        return { hasAccess: false, reason: "User not found" };
    }

    // First check page-specific permissions
    const pagePermissions = await db.query.wikiPagePermissions.findMany({
        where: eq(wikiPagePermissions.pageId, parseInt(pageId)),
    });

    // If there are page-specific permissions, use those
    if (pagePermissions.length > 0) {
        return checkPermissionRequirements(pagePermissions, user, action);
    }

    // If no page-specific permissions, check collection permissions
    const collectionPermissions =
        await db.query.wikiCollectionPermissions.findMany({
            where: eq(
                wikiCollectionPermissions.collectionId,
                page.collectionId
            ),
        });

    return checkPermissionRequirements(collectionPermissions, user, action);
}

// Helper functions to manage permissions
export async function addCollectionPermission(
    collectionId: number,
    action: "view" | "edit",
    type: "rank" | "department" | "position",
    value: string
) {
    return db.insert(wikiCollectionPermissions).values({
        collectionId,
        action,
        type,
        value,
    });
}

export async function addPagePermission(
    pageId: string,
    action: "view" | "edit",
    type: "rank" | "department" | "position",
    value: string
) {
    return db.insert(wikiPagePermissions).values({
        pageId: parseInt(pageId),
        action,
        type,
        value,
    });
}

export async function removeCollectionPermission(permissionId: string) {
    return db
        .delete(wikiCollectionPermissions)
        .where(eq(wikiCollectionPermissions.id, permissionId));
}

export async function removePagePermission(permissionId: string) {
    return db
        .delete(wikiPagePermissions)
        .where(eq(wikiPagePermissions.id, permissionId));
}

// Example usage:
/*
// Setting up Training Wiki collection permissions
await addCollectionPermission(1, "view", "department", "training"); // All training department members can view
await addCollectionPermission(1, "view", "rank", "JNCO"); // All JNCO+ can view
await addCollectionPermission(1, "edit", "position", "123"); // Training Lead can edit
await addCollectionPermission(1, "edit", "rank", "SNCO"); // All SNCO+ can edit

// Setting up specific page permissions (overrides collection permissions)
await addPagePermission("abc-123", "view", "position", "456"); // Only specific instructor can view
await addPagePermission("abc-123", "edit", "position", "789"); // Only specific senior instructor can edit

// Checking permissions
const canView = await checkWikiPageAccess(userId, "abc-123", "view");
const canEdit = await checkWikiPageAccess(userId, "abc-123", "edit");

if (canView.hasAccess) {
    // Show the page
} else {
    // Show error message: canView.reason
}

if (canEdit.hasAccess) {
    // Show edit button
} else {
    // Hide edit button
}
*/
