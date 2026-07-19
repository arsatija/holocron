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
    getWikiCollection,
    getCollectionPageTree,
    getRecentlyUpdatedPages,
    getStarredPages,
    getWikiPage,
    getPageAncestors,
    getPageBacklinks,
    isPageStarred,
    type WikiPageTreeNode,
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

export interface SidebarCollection {
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    canEdit: boolean;
    tree: WikiPageTreeNode[];
}

export async function getWikiSidebarData() {
    const ctx = await getTrooperCtx();
    const collections = await getReadableCollections(ctx);

    const withTrees: SidebarCollection[] = await Promise.all(
        collections.map(async (collection) => {
            const canEdit = canEditCollection(ctx, collection);
            const tree = await getCollectionPageTree(collection.id, {
                includeDrafts: canEdit,
            });
            return {
                id: collection.id,
                slug: collection.slug,
                name: collection.name,
                icon: collection.icon,
                canEdit,
                tree,
            };
        })
    );

    return { ctx, collections: withTrees, canManage: canManageWiki(ctx) };
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

export async function getWikiPageData(collectionSlug: string, pageId: string) {
    const ctx = await getTrooperCtx();
    const collection = await getWikiCollectionBySlug(collectionSlug);
    if (!collection || !canReadCollection(ctx, collection)) {
        return null;
    }

    const page = await getWikiPage(pageId);
    if (!page || page.collectionId !== collection.id) {
        return null;
    }

    const canEdit = canEditCollection(ctx, collection);
    // Drafts don't exist for readers — 404 rather than leak that an unpublished
    // page exists, per plans/wiki.md's "not-found/denied" rule.
    if (!page.isPublished && !canEdit) {
        return null;
    }

    const [ancestors, rawBacklinks, starred] = await Promise.all([
        getPageAncestors(pageId),
        getPageBacklinks(pageId),
        ctx ? isPageStarred(pageId, ctx.id) : Promise.resolve(false),
    ]);

    // Backlinks can (in principle) come from another collection — resolve each
    // source page's collection slug so the panel can link to it.
    const collectionIds = [...new Set(rawBacklinks.map((b) => b.collectionId))];
    const slugEntries = await Promise.all(
        collectionIds.map(async (id) => [id, await getWikiCollection(id)] as const)
    );
    const slugById = new Map(slugEntries.map(([id, c]) => [id, c?.slug ?? null]));
    const backlinks = rawBacklinks
        .map((b) => ({ ...b, collectionSlug: slugById.get(b.collectionId) ?? null }))
        .filter((b) => b.collectionSlug !== null) as Array<{
        id: string;
        title: string;
        collectionId: string;
        collectionSlug: string;
    }>;

    return {
        ctx,
        collection,
        page,
        ancestors,
        backlinks,
        starred,
        canEdit,
        canManage: canManageWiki(ctx),
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
