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
    getPageRevisions,
    getPageRevision,
    isPageStarred,
    getPinnedPages,
    searchWikiPages,
    type WikiPageTreeNode,
    type WikiSearchResult,
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

    // Billet/position slugs are free-text, admin-entered, and not enforced
    // unique (see billet-form.tsx / position-form.tsx) — a billet and a
    // department position can end up with the same slug. checkPermissionsSync
    // checks billetPermissions and positionPermissions separately, so either
    // source grants access identically; dedupe here just avoids showing (and
    // React-key-colliding on) two indistinguishable entries in the picker.
    const seen = new Set<string>();
    return options.filter((option) => {
        if (seen.has(option.value)) return false;
        seen.add(option.value);
        return true;
    });
}

export interface SidebarCollection {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    readPermissions: string[];
    editPermissions: string[];
    canEdit: boolean;
    tree: WikiPageTreeNode[];
}

export interface StarredSidebarPage {
    pageId: string;
    title: string;
    collectionSlug: string;
}

export type PinnedSidebarPage = StarredSidebarPage;

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
                description: collection.description,
                icon: collection.icon,
                readPermissions: collection.readPermissions,
                editPermissions: collection.editPermissions,
                canEdit,
                tree,
            };
        })
    );

    const slugById = new Map(withTrees.map((c) => [c.id, c.slug]));
    const readableCollectionIds = withTrees.map((c) => c.id);

    const [rawStarred, rawPinned] = await Promise.all([
        ctx ? getStarredPages(ctx.id) : Promise.resolve([]),
        getPinnedPages(readableCollectionIds),
    ]);

    const starred: StarredSidebarPage[] = rawStarred
        .map((s) => ({
            pageId: s.pageId,
            title: s.title,
            collectionSlug: slugById.get(s.collectionId) ?? null,
        }))
        .filter((s): s is StarredSidebarPage => s.collectionSlug !== null);

    const pinned: PinnedSidebarPage[] = rawPinned
        .map((p) => ({
            pageId: p.id,
            title: p.title,
            collectionSlug: slugById.get(p.collectionId) ?? null,
        }))
        .filter((p): p is PinnedSidebarPage => p.collectionSlug !== null);

    // For PageTree's inline star indicator/toggle — every collection's tree
    // shares this one set since a page's starred-ness isn't collection-scoped.
    const starredIds = new Set(rawStarred.map((s) => s.pageId));

    return {
        ctx,
        collections: withTrees,
        canManage: canManageWiki(ctx),
        starred,
        pinned,
        starredIds,
    };
}

export interface WikiSearchResultWithSlug extends WikiSearchResult {
    collectionSlug: string;
}

// Shared by the search page (SSR) and the command-palette search action
// (client) so both apply identical collection-permission scoping.
export async function getWikiSearchResults(
    query: string
): Promise<WikiSearchResultWithSlug[]> {
    const ctx = await getTrooperCtx();
    const collections = await getReadableCollections(ctx);
    const readableIds = collections.map((c) => c.id);
    const editableIds = collections
        .filter((c) => canEditCollection(ctx, c))
        .map((c) => c.id);
    const slugById = new Map(collections.map((c) => [c.id, c.slug]));

    const results = await searchWikiPages(query, readableIds, editableIds);
    return results
        .map((r) => ({ ...r, collectionSlug: slugById.get(r.collectionId) ?? null }))
        .filter((r): r is WikiSearchResultWithSlug => r.collectionSlug !== null);
}

export async function getWikiHomeData() {
    const ctx = await getTrooperCtx();
    const collections = await getReadableCollections(ctx);
    const readableCollectionIds = collections.map((c) => c.id);

    const [starred, recent, pinned] = await Promise.all([
        ctx ? getStarredPages(ctx.id) : Promise.resolve([]),
        getRecentlyUpdatedPages(readableCollectionIds),
        getPinnedPages(readableCollectionIds),
    ]);

    return {
        ctx,
        collections,
        canManage: canManageWiki(ctx),
        starred,
        recent,
        pinned,
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

// History is an editor-only surface — it exposes past revision content
// (which may include content from when the page was still a draft), so it's
// gated the same as the edit route rather than the (looser) read gate.
export async function getPageHistoryData(collectionSlug: string, pageId: string) {
    const ctx = await getTrooperCtx();
    const collection = await getWikiCollectionBySlug(collectionSlug);
    if (!collection || !canEditCollection(ctx, collection)) {
        return null;
    }

    const page = await getWikiPage(pageId);
    if (!page || page.collectionId !== collection.id) {
        return null;
    }

    const [revisions, ancestors] = await Promise.all([
        getPageRevisions(pageId),
        getPageAncestors(pageId),
    ]);

    return { ctx, collection, page, revisions, ancestors };
}

export async function getRevisionData(
    collectionSlug: string,
    pageId: string,
    revisionId: string
) {
    const ctx = await getTrooperCtx();
    const collection = await getWikiCollectionBySlug(collectionSlug);
    if (!collection || !canEditCollection(ctx, collection)) {
        return null;
    }

    const revision = await getPageRevision(revisionId);
    if (!revision || revision.pageId !== pageId) {
        return null;
    }

    return { collection, revision };
}

export async function getCollectionPageData(slug: string) {
    const ctx = await getTrooperCtx();
    const collection = await getWikiCollectionBySlug(slug);
    if (!collection || !canReadCollection(ctx, collection)) {
        return null;
    }

    const canEdit = canEditCollection(ctx, collection);
    const canManage = canManageWiki(ctx);
    const [tree, rawStarred] = await Promise.all([
        getCollectionPageTree(collection.id, { includeDrafts: canEdit }),
        ctx ? getStarredPages(ctx.id) : Promise.resolve([]),
    ]);
    const starredIds = new Set(rawStarred.map((s) => s.pageId));

    return { ctx, collection, tree, canEdit, canManage, starredIds };
}
