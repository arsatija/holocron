import "server-only";

import { RankLevel } from "@/lib/types";
import { getTrooperCtx } from "@/services/wiki-permissions";
import {
    canEditCollection,
    canManageWiki,
    canReadCollection,
    getReadableCollections,
} from "@/services/wiki-permissions";
import {
    getWikiCollectionBySlug,
    getCollectionPageTree,
    getRecentlyUpdatedPages,
    getStarredPages,
} from "@/services/wiki";
import { getAllBillets } from "@/services/billets";
import { getAllDepartmentPositions } from "@/services/departments";

// Static, cheap to hardcode — mirrors nav-main.tsx's qualification category list.
const QUAL_CATEGORIES = [
    "Standard",
    "Medical",
    "Advanced",
    "Aviation",
    "Detachments",
    "Leadership",
    "Zeus",
];

const DEPARTMENT_SCOPES = [
    "Admin",
    "Recruitment",
    "Training",
    "Attendance",
    "Roster",
    "Qualifications",
    "Mod",
    "SGD",
];

export interface PermissionOption {
    label: string;
    value: string;
    group: string;
}

// Options for the collection permission builder: rank levels, department scopes,
// qualification categories, and billet/position slugs (dynamic, so fetched).
export async function getPermissionOptions(): Promise<PermissionOption[]> {
    const [billets, positions] = await Promise.all([
        getAllBillets(),
        getAllDepartmentPositions(),
    ]);

    const options: PermissionOption[] = [
        ...Object.values(RankLevel).map((level) => ({
            label: level,
            value: level,
            group: "Rank",
        })),
        ...DEPARTMENT_SCOPES.map((scope) => ({
            label: scope,
            value: scope,
            group: "Department",
        })),
        ...QUAL_CATEGORIES.map((category) => ({
            label: category,
            value: `qual:${category}`,
            group: "Qualification",
        })),
    ];

    for (const billet of billets) {
        if (!billet.slug) continue;
        options.push({
            label: billet.unitElementName ? `${billet.unitElementName} ${billet.role}` : billet.role,
            value: billet.slug,
            group: "Billet",
        });
    }

    for (const position of positions) {
        if (!position.slug) continue;
        options.push({
            label: position.departmentName ? `${position.departmentName} ${position.role}` : position.role,
            value: position.slug,
            group: "Position",
        });
    }

    return options;
}

export async function getWikiSidebarData() {
    const ctx = await getTrooperCtx();
    const collections = await getReadableCollections(ctx);
    return { ctx, collections, canManage: canManageWiki(ctx) };
}

export async function getWikiHomeData() {
    const ctx = await getTrooperCtx();
    const collections = await getReadableCollections(ctx);
    const readableCollectionIds = collections.map((c) => c.id);

    const [starred, recent] = await Promise.all([
        ctx ? getStarredPages(ctx.id) : Promise.resolve([]),
        getRecentlyUpdatedPages(readableCollectionIds),
    ]);

    return {
        ctx,
        collections,
        canManage: canManageWiki(ctx),
        starred,
        recent,
    };
}

export async function getCollectionPageData(slug: string) {
    const ctx = await getTrooperCtx();
    const collection = await getWikiCollectionBySlug(slug);
    if (!collection || !canReadCollection(ctx, collection)) {
        return null;
    }

    const canEdit = canEditCollection(ctx, collection);
    const canManage = canManageWiki(ctx);
    const tree = await getCollectionPageTree(collection.id, {
        includeDrafts: canEdit,
    });

    return { ctx, collection, tree, canEdit, canManage };
}
