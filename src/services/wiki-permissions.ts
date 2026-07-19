"use server";

import { db } from "@/db";
import type { WikiCollection } from "@/db/schema";
import { checkPermissionsSync, type UserTrooperInfo } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

export { getTrooperCtx } from "@/services/trooper-ctx";

export const WIKI_MANAGER_PERMISSIONS: string[] = [
    RankLevel.Command,
    "admin:lead",
    "admin:2ic",
];

export function canManageWiki(ctx: UserTrooperInfo | null): boolean {
    return checkPermissionsSync(ctx, WIKI_MANAGER_PERMISSIONS);
}

export function canReadCollection(
    ctx: UserTrooperInfo | null,
    collection: Pick<WikiCollection, "readPermissions">
): boolean {
    if (canManageWiki(ctx)) return true;
    if (collection.readPermissions.length === 0) return true;
    return checkPermissionsSync(ctx, collection.readPermissions);
}

export function canEditCollection(
    ctx: UserTrooperInfo | null,
    collection: Pick<WikiCollection, "readPermissions" | "editPermissions">
): boolean {
    if (canManageWiki(ctx)) return true;
    if (collection.editPermissions.length === 0) {
        return canReadCollection(ctx, collection);
    }
    return checkPermissionsSync(ctx, collection.editPermissions);
}

// Collection count is small — fetching all and filtering in-memory is the only
// way to reuse checkPermissionsSync (it's not expressible as a SQL predicate).
export async function getReadableCollections(
    ctx: UserTrooperInfo | null
): Promise<WikiCollection[]> {
    const all = await db.query.wikiCollections.findMany({
        orderBy: (c, { asc }) => [asc(c.order), asc(c.name)],
    });
    return all.filter((collection) => canReadCollection(ctx, collection));
}
