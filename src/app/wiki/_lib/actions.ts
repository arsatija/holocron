"use server";

import { z } from "zod";
import { collectionFormSchema, pageTitleSchema } from "./schema";
import {
    createWikiCollection,
    updateWikiCollection,
    deleteWikiCollection,
    createWikiPage,
    updateWikiPage,
    publishWikiPage,
    unpublishWikiPage,
    deleteWikiPage,
    toggleWikiPageStar,
    getWikiPage,
    getWikiCollection,
    searchTroopersForMention,
    searchWikiPagesByTitle,
} from "@/services/wiki";
import {
    canManageWiki,
    canEditCollection,
    canReadCollection,
    getReadableCollections,
    getTrooperCtx,
} from "@/services/wiki-permissions";
import type { UserTrooperInfo } from "@/lib/permissions";

async function requireWikiManager() {
    const ctx = await getTrooperCtx();
    if (!canManageWiki(ctx)) {
        throw new Error("You do not have permission to manage the wiki");
    }
    return ctx!;
}

// Every page mutation is scoped to the page's *collection* permissions — there
// are no per-page overrides (see plans/wiki.md decisions).
async function requireCollectionEditor(
    collectionId: string
): Promise<UserTrooperInfo> {
    const ctx = await getTrooperCtx();
    const collection = await getWikiCollection(collectionId);
    if (!collection || !canEditCollection(ctx, collection)) {
        throw new Error("You do not have permission to edit this collection");
    }
    return ctx!;
}

async function requireCollectionReader(
    collectionId: string
): Promise<UserTrooperInfo> {
    const ctx = await getTrooperCtx();
    const collection = await getWikiCollection(collectionId);
    if (!collection || !canReadCollection(ctx, collection)) {
        throw new Error("You do not have permission to read this collection");
    }
    if (!ctx) throw new Error("You must be signed in");
    return ctx;
}

async function requirePageEditor(pageId: string) {
    const page = await getWikiPage(pageId);
    if (!page) throw new Error("Wiki page not found");
    const ctx = await requireCollectionEditor(page.collectionId);
    return { ctx, page };
}

export async function createCollectionAction(
    input: z.infer<typeof collectionFormSchema>
) {
    try {
        const ctx = await requireWikiManager();
        const data = collectionFormSchema.parse(input);
        return await createWikiCollection(
            {
                name: data.name,
                description: data.description ?? "",
                icon: data.icon ?? null,
                readPermissions: data.readPermissions,
                editPermissions: data.editPermissions,
            },
            ctx.id
        );
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create collection",
        };
    }
}

export async function updateCollectionAction(
    id: string,
    input: z.infer<typeof collectionFormSchema>
) {
    try {
        const ctx = await requireWikiManager();
        const data = collectionFormSchema.parse(input);
        return await updateWikiCollection(
            id,
            {
                name: data.name,
                description: data.description ?? "",
                icon: data.icon ?? null,
                readPermissions: data.readPermissions,
                editPermissions: data.editPermissions,
            },
            ctx.id
        );
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update collection",
        };
    }
}

export async function deleteCollectionAction(id: string) {
    try {
        const ctx = await requireWikiManager();
        return await deleteWikiCollection(id, ctx.id);
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete collection",
        };
    }
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export async function createPageAction(input: {
    collectionId: string;
    parentPageId?: string | null;
    title: string;
}) {
    try {
        const ctx = await requireCollectionEditor(input.collectionId);
        const data = pageTitleSchema.parse({ title: input.title });
        return await createWikiPage(
            {
                collectionId: input.collectionId,
                parentPageId: input.parentPageId ?? null,
                title: data.title,
            },
            ctx.id
        );
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to create page",
        };
    }
}

export async function updatePageAction(
    pageId: string,
    input: { title?: string; content?: string }
) {
    try {
        const { ctx } = await requirePageEditor(pageId);
        return await updateWikiPage(pageId, input, ctx.id);
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to update page",
        };
    }
}

export async function publishPageAction(pageId: string) {
    try {
        const { ctx } = await requirePageEditor(pageId);
        return await publishWikiPage(pageId, ctx.id);
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to publish page",
        };
    }
}

export async function unpublishPageAction(pageId: string) {
    try {
        const { ctx } = await requirePageEditor(pageId);
        return await unpublishWikiPage(pageId, ctx.id);
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to unpublish page",
        };
    }
}

export async function deletePageAction(pageId: string) {
    try {
        const { ctx } = await requirePageEditor(pageId);
        return await deleteWikiPage(pageId, ctx.id);
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to delete page",
        };
    }
}

export async function toggleStarAction(pageId: string) {
    try {
        const page = await getWikiPage(pageId);
        if (!page) throw new Error("Wiki page not found");
        const ctx = await requireCollectionReader(page.collectionId);
        return await toggleWikiPageStar(pageId, ctx.id);
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to toggle star",
        };
    }
}

// ---------------------------------------------------------------------------
// Editor suggestion pickers (@mentions, [[ page links)
// ---------------------------------------------------------------------------

// Any signed-in trooper can look up other troopers to @mention — mirrors the
// visibility of the trooper directory/roster, not collection permissions.
export async function searchTroopersForMentionAction(query: string) {
    const ctx = await getTrooperCtx();
    if (!ctx) return [];
    const results = await searchTroopersForMention(query);
    return results.map((t) => ({ id: t.id, label: t.fullName }));
}

export async function searchPagesForLinkAction(query: string) {
    const ctx = await getTrooperCtx();
    const collections = await getReadableCollections(ctx);
    const readableIds = collections.map((c) => c.id);
    const results = await searchWikiPagesByTitle(query, readableIds);
    return results.map((p) => ({
        id: p.id,
        label: p.title,
        collectionSlug: p.collectionSlug,
    }));
}
