import type { RankLevel } from "@/db/schema";

interface UserTrooperInfo {
    id: string;
    fullName: string;
    rankLevel: RankLevel;
    departments: string[];
    billetSlug?: string | null;
    positionSlugs?: string[];
    billetPermissions?: string[]; // Expanded hierarchy chain for billet
    positionPermissions?: string[]; // Expanded hierarchy chains for positions
}

/**
 * Check if user has permission based on their context
 * Hierarchy is pre-expanded in billetPermissions and positionPermissions,
 * so this is a simple direct match check.
 */
export function checkPermissionsSync(
    userCtx: UserTrooperInfo | null,
    allowedPermissions: string[]
): boolean {
    // If no permissions are required, allow access
    if (allowedPermissions.length === 0) {
        return true;
    }

    // If no user context, deny access
    if (!userCtx) {
        return false;
    }

    // Check each allowed permission
    for (const permission of allowedPermissions) {
        // Check rank level
        if (permission === userCtx.rankLevel) {
            return true;
        }

        // Check department scopes
        if (userCtx.departments?.includes(permission)) {
            return true;
        }

        // Check billet permissions (includes full hierarchy chain)
        // Handle undefined for backward compatibility (users who haven't re-logged in)
        if (userCtx.billetPermissions?.includes(permission)) {
            return true;
        }

        // Check position permissions (includes full hierarchy chains)
        // Handle undefined for backward compatibility (users who haven't re-logged in)
        if (userCtx.positionPermissions?.includes(permission)) {
            return true;
        }
    }

    return false;
}
