"use server";

import { db } from "@/db";
import {
    wikiCollections,
    wikiPages,
    wikiPageRevisions,
    wikiPageStars,
    wikiPageLinks,
    troopers,
    ranks,
    type WikiCollection,
} from "@/db/schema";
import { eq, and, desc, asc, not, ilike, isNull, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";
import { getTrooper } from "./troopers";
import { getRank } from "./ranks";
import { getFullTrooperName } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getTrooperDisplayName(
    trooperId: string | null
): Promise<string | null> {
    if (!trooperId) return null;
    const trooper = await getTrooper(trooperId);
    if (!trooper) return null;
    const rank = await getRank(trooper.rank);
    return getFullTrooperName({ ...trooper, rankAbbr: rank?.abbreviation ?? null });
}

function slugify(name: string): string {
    return (
        name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "collection"
    );
}

async function generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let suffix = 1;
    while (
        await db.query.wikiCollections.findFirst({
            where: eq(wikiCollections.slug, slug),
        })
    ) {
        suffix += 1;
        slug = `${base}-${suffix}`;
    }
    return slug;
}

// Server-side plain-text extraction from Tiptap HTML, for the contentText
// column that feeds full-text search. Doesn't need to be perfect — just close
// enough that search matches make sense.
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

// Internal page links are inserted by the editor's `[[` picker carrying a
// data-wiki-page-id attribute — that's what we read back on save.
function extractLinkedPageIds(html: string): string[] {
    const regex = /data-wiki-page-id="([0-9a-fA-F-]{36})"/g;
    const ids = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html))) {
        ids.add(match[1]);
    }
    return [...ids];
}

async function wouldCreateCycle(
    pageId: string,
    newParentPageId: string | null
): Promise<boolean> {
    if (!newParentPageId) return false;
    if (newParentPageId === pageId) return true;

    let currentId: string | null = newParentPageId;
    const visited = new Set<string>();
    while (currentId) {
        if (currentId === pageId) return true;
        if (visited.has(currentId)) break; // guard against pre-existing bad data
        visited.add(currentId);
        const [parent] = await db
            .select({ parentPageId: wikiPages.parentPageId })
            .from(wikiPages)
            .where(eq(wikiPages.id, currentId))
            .limit(1);
        currentId = parent?.parentPageId ?? null;
    }
    return false;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export async function getWikiCollections(): Promise<WikiCollection[]> {
    try {
        return await db.query.wikiCollections.findMany({
            orderBy: (c, { asc }) => [asc(c.order), asc(c.name)],
        });
    } catch (error) {
        console.error("Error fetching wiki collections:", error);
        return [];
    }
}

export async function getWikiCollectionBySlug(
    slug: string
): Promise<WikiCollection | null> {
    try {
        return (
            (await db.query.wikiCollections.findFirst({
                where: eq(wikiCollections.slug, slug),
            })) ?? null
        );
    } catch (error) {
        console.error(`Error fetching wiki collection: ${slug}`, error);
        return null;
    }
}

export async function getWikiCollection(
    id: string
): Promise<WikiCollection | null> {
    try {
        return (
            (await db.query.wikiCollections.findFirst({
                where: eq(wikiCollections.id, id),
            })) ?? null
        );
    } catch (error) {
        console.error(`Error fetching wiki collection: ${id}`, error);
        return null;
    }
}

export interface WikiCollectionInput {
    name: string;
    description?: string;
    icon?: string | null;
    readPermissions?: string[];
    editPermissions?: string[];
}

export async function createWikiCollection(
    input: WikiCollectionInput,
    actorId?: string
) {
    try {
        const slug = await generateUniqueSlug(input.name);
        const [row] = await db
            .insert(wikiCollections)
            .values({
                name: input.name,
                slug,
                description: input.description ?? "",
                icon: input.icon ?? null,
                readPermissions: input.readPermissions ?? [],
                editPermissions: input.editPermissions ?? [],
                createdBy: actorId ?? null,
            })
            .returning();

        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "wiki_collection",
            entityId: row.id,
            entityLabel: row.name,
            newData: row as unknown as Record<string, unknown>,
        });
        return { success: true, id: row.id, slug: row.slug };
    } catch (error) {
        console.error("Error creating wiki collection:", error);
        return { error: "Failed to create wiki collection" };
    }
}

export async function updateWikiCollection(
    id: string,
    input: Partial<
        WikiCollectionInput & { order: number }
    >,
    actorId?: string
) {
    try {
        const previous = await db.query.wikiCollections.findFirst({
            where: eq(wikiCollections.id, id),
        });
        if (!previous) return { error: "Wiki collection not found" };

        // Slug stays stable after creation, even if the name changes — avoids
        // breaking existing /wiki/[collectionSlug] URLs.
        const [updated] = await db
            .update(wikiCollections)
            .set(input)
            .where(eq(wikiCollections.id, id))
            .returning();

        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "wiki_collection",
            entityId: id,
            entityLabel: updated.name,
            previousData: previous as unknown as Record<string, unknown>,
            newData: input as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error(`Error updating wiki collection: ${id}`, error);
        return { error: "Failed to update wiki collection" };
    }
}

export async function deleteWikiCollection(id: string, actorId?: string) {
    try {
        const previous = await db.query.wikiCollections.findFirst({
            where: eq(wikiCollections.id, id),
        });
        await db.delete(wikiCollections).where(eq(wikiCollections.id, id));
        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "wiki_collection",
            entityId: id,
            entityLabel: previous?.name,
            previousData: previous as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error(`Error deleting wiki collection: ${id}`, error);
        return { error: "Failed to delete wiki collection" };
    }
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export interface WikiPageTreeNode {
    id: string;
    title: string;
    parentPageId: string | null;
    order: number;
    isPublished: boolean;
    children: WikiPageTreeNode[];
}

export async function getCollectionPageTree(
    collectionId: string,
    { includeDrafts = false }: { includeDrafts?: boolean } = {}
): Promise<WikiPageTreeNode[]> {
    try {
        const rows = await db
            .select({
                id: wikiPages.id,
                title: wikiPages.title,
                parentPageId: wikiPages.parentPageId,
                order: wikiPages.order,
                isPublished: wikiPages.isPublished,
            })
            .from(wikiPages)
            .where(
                includeDrafts
                    ? eq(wikiPages.collectionId, collectionId)
                    : and(
                          eq(wikiPages.collectionId, collectionId),
                          eq(wikiPages.isPublished, true)
                      )
            );

        const byId = new Map<string, WikiPageTreeNode>();
        for (const row of rows) {
            byId.set(row.id, { ...row, children: [] });
        }

        const roots: WikiPageTreeNode[] = [];
        for (const node of byId.values()) {
            const parent = node.parentPageId ? byId.get(node.parentPageId) : undefined;
            if (parent) {
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        }

        const sortTree = (nodes: WikiPageTreeNode[]) => {
            nodes.sort((a, b) => a.order - b.order);
            nodes.forEach((n) => sortTree(n.children));
        };
        sortTree(roots);

        return roots;
    } catch (error) {
        console.error(
            `Error fetching page tree for collection: ${collectionId}`,
            error
        );
        return [];
    }
}

export interface WikiPageAncestor {
    id: string;
    title: string;
}

// Root-to-parent order (excludes the page itself), for breadcrumbs.
export async function getPageAncestors(
    pageId: string
): Promise<WikiPageAncestor[]> {
    try {
        const chain: WikiPageAncestor[] = [];
        let currentId: string | null = pageId;
        const visited = new Set<string>();
        while (currentId) {
            const [row] = await db
                .select({
                    id: wikiPages.id,
                    title: wikiPages.title,
                    parentPageId: wikiPages.parentPageId,
                })
                .from(wikiPages)
                .where(eq(wikiPages.id, currentId))
                .limit(1);
            if (!row || !row.parentPageId || visited.has(row.parentPageId)) break;
            visited.add(row.parentPageId);
            const [parent] = await db
                .select({ id: wikiPages.id, title: wikiPages.title })
                .from(wikiPages)
                .where(eq(wikiPages.id, row.parentPageId))
                .limit(1);
            if (!parent) break;
            chain.unshift(parent);
            currentId = row.parentPageId;
        }
        return chain;
    } catch (error) {
        console.error(`Error fetching ancestors for page: ${pageId}`, error);
        return [];
    }
}

export async function getWikiPage(pageId: string) {
    try {
        const page = await db.query.wikiPages.findFirst({
            where: eq(wikiPages.id, pageId),
        });
        if (!page) return null;

        const [createdByName, lastEditedByName] = await Promise.all([
            getTrooperDisplayName(page.createdBy),
            getTrooperDisplayName(page.lastEditedBy),
        ]);

        return { ...page, createdByName, lastEditedByName };
    } catch (error) {
        console.error(`Error fetching wiki page: ${pageId}`, error);
        return null;
    }
}

export interface CreateWikiPageInput {
    collectionId: string;
    parentPageId?: string | null;
    title: string;
}

export async function createWikiPage(
    input: CreateWikiPageInput,
    actorId?: string
) {
    try {
        const siblings = await db
            .select({ order: wikiPages.order })
            .from(wikiPages)
            .where(
                input.parentPageId
                    ? and(
                          eq(wikiPages.collectionId, input.collectionId),
                          eq(wikiPages.parentPageId, input.parentPageId)
                      )
                    : and(
                          eq(wikiPages.collectionId, input.collectionId),
                          isNull(wikiPages.parentPageId)
                      )
            );
        const nextOrder =
            siblings.length > 0
                ? Math.max(...siblings.map((s) => s.order)) + 1
                : 0;

        const [row] = await db
            .insert(wikiPages)
            .values({
                collectionId: input.collectionId,
                parentPageId: input.parentPageId ?? null,
                title: input.title,
                order: nextOrder,
                createdBy: actorId ?? null,
                lastEditedBy: actorId ?? null,
            })
            .returning();

        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "wiki_page",
            entityId: row.id,
            entityLabel: row.title,
            newData: row as unknown as Record<string, unknown>,
        });
        return { success: true, id: row.id };
    } catch (error) {
        console.error("Error creating wiki page:", error);
        return { error: "Failed to create wiki page" };
    }
}

export async function updateWikiPage(
    pageId: string,
    input: { title?: string; content?: string },
    actorId?: string
) {
    try {
        const previous = await db.query.wikiPages.findFirst({
            where: eq(wikiPages.id, pageId),
        });
        if (!previous) return { error: "Wiki page not found" };

        const nextTitle = input.title ?? previous.title;
        const nextContent = input.content ?? previous.content;
        const contentChanged =
            nextTitle !== previous.title || nextContent !== previous.content;

        if (contentChanged) {
            await db.insert(wikiPageRevisions).values({
                pageId,
                title: previous.title,
                content: previous.content,
                editedBy: previous.lastEditedBy,
            });
        }

        const contentText = stripHtml(nextContent);

        const [updated] = await db
            .update(wikiPages)
            .set({
                title: nextTitle,
                content: nextContent,
                contentText,
                lastEditedBy: actorId ?? null,
            })
            .where(eq(wikiPages.id, pageId))
            .returning();

        // Re-extract internal links, keeping only targets that still exist.
        const candidateIds = extractLinkedPageIds(nextContent).filter(
            (id) => id !== pageId
        );
        let linkedPageIds: string[] = [];
        if (candidateIds.length > 0) {
            const existing = await db
                .select({ id: wikiPages.id })
                .from(wikiPages)
                .where(inArray(wikiPages.id, candidateIds));
            linkedPageIds = existing.map((e) => e.id);
        }
        await db
            .delete(wikiPageLinks)
            .where(eq(wikiPageLinks.sourcePageId, pageId));
        if (linkedPageIds.length > 0) {
            await db.insert(wikiPageLinks).values(
                linkedPageIds.map((targetPageId) => ({
                    sourcePageId: pageId,
                    targetPageId,
                }))
            );
        }

        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "wiki_page",
            entityId: pageId,
            entityLabel: nextTitle,
            previousData: previous as unknown as Record<string, unknown>,
            newData: updated as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error(`Error updating wiki page: ${pageId}`, error);
        return { error: "Failed to update wiki page" };
    }
}

export async function publishWikiPage(pageId: string, actorId?: string) {
    try {
        const previous = await db.query.wikiPages.findFirst({
            where: eq(wikiPages.id, pageId),
        });
        if (!previous) return { error: "Wiki page not found" };

        await db
            .update(wikiPages)
            .set({ isPublished: true, publishedAt: new Date() })
            .where(eq(wikiPages.id, pageId));

        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "wiki_page",
            entityId: pageId,
            entityLabel: `${previous.title} — Published`,
            previousData: { isPublished: previous.isPublished },
            newData: { isPublished: true },
        });
        return { success: true };
    } catch (error) {
        console.error(`Error publishing wiki page: ${pageId}`, error);
        return { error: "Failed to publish wiki page" };
    }
}

export async function unpublishWikiPage(pageId: string, actorId?: string) {
    try {
        const previous = await db.query.wikiPages.findFirst({
            where: eq(wikiPages.id, pageId),
        });
        if (!previous) return { error: "Wiki page not found" };

        await db
            .update(wikiPages)
            .set({ isPublished: false })
            .where(eq(wikiPages.id, pageId));

        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "wiki_page",
            entityId: pageId,
            entityLabel: `${previous.title} — Unpublished`,
            previousData: { isPublished: previous.isPublished },
            newData: { isPublished: false },
        });
        return { success: true };
    } catch (error) {
        console.error(`Error unpublishing wiki page: ${pageId}`, error);
        return { error: "Failed to unpublish wiki page" };
    }
}

export async function moveWikiPage(
    pageId: string,
    input: { parentPageId: string | null; order: number; collectionId?: string },
    actorId?: string
) {
    try {
        if (await wouldCreateCycle(pageId, input.parentPageId)) {
            return { error: "Cannot move a page into its own subtree" };
        }

        const previous = await db.query.wikiPages.findFirst({
            where: eq(wikiPages.id, pageId),
        });
        if (!previous) return { error: "Wiki page not found" };

        const [updated] = await db
            .update(wikiPages)
            .set({
                parentPageId: input.parentPageId,
                order: input.order,
                collectionId: input.collectionId ?? previous.collectionId,
            })
            .where(eq(wikiPages.id, pageId))
            .returning();

        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "wiki_page",
            entityId: pageId,
            entityLabel: `${updated.title} — Moved`,
            previousData: {
                parentPageId: previous.parentPageId,
                order: previous.order,
                collectionId: previous.collectionId,
            },
            newData: {
                parentPageId: updated.parentPageId,
                order: updated.order,
                collectionId: updated.collectionId,
            },
        });
        return { success: true };
    } catch (error) {
        console.error(`Error moving wiki page: ${pageId}`, error);
        return { error: "Failed to move wiki page" };
    }
}

export async function deleteWikiPage(pageId: string, actorId?: string) {
    try {
        const previous = await db.query.wikiPages.findFirst({
            where: eq(wikiPages.id, pageId),
        });
        await db.delete(wikiPages).where(eq(wikiPages.id, pageId));
        revalidateTag("wiki");
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "wiki_page",
            entityId: pageId,
            entityLabel: previous?.title,
            previousData: previous as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error(`Error deleting wiki page: ${pageId}`, error);
        return { error: "Failed to delete wiki page" };
    }
}

// ---------------------------------------------------------------------------
// Revisions
// ---------------------------------------------------------------------------

export async function getPageRevisions(pageId: string) {
    try {
        const rows = await db
            .select({
                id: wikiPageRevisions.id,
                title: wikiPageRevisions.title,
                editedBy: wikiPageRevisions.editedBy,
                createdAt: wikiPageRevisions.createdAt,
            })
            .from(wikiPageRevisions)
            .where(eq(wikiPageRevisions.pageId, pageId))
            .orderBy(desc(wikiPageRevisions.createdAt));

        return await Promise.all(
            rows.map(async (row) => ({
                ...row,
                editedByName: await getTrooperDisplayName(row.editedBy),
            }))
        );
    } catch (error) {
        console.error(`Error fetching revisions for page: ${pageId}`, error);
        return [];
    }
}

export async function getPageRevision(revisionId: string) {
    try {
        return (
            (await db.query.wikiPageRevisions.findFirst({
                where: eq(wikiPageRevisions.id, revisionId),
            })) ?? null
        );
    } catch (error) {
        console.error(`Error fetching revision: ${revisionId}`, error);
        return null;
    }
}

export async function restorePageRevision(
    pageId: string,
    revisionId: string,
    actorId?: string
) {
    try {
        const revision = await db.query.wikiPageRevisions.findFirst({
            where: eq(wikiPageRevisions.id, revisionId),
        });
        if (!revision || revision.pageId !== pageId) {
            return { error: "Revision not found" };
        }

        // updateWikiPage already snapshots the current state as a new revision
        // before applying the change, so restoring is just "update to the old values".
        return await updateWikiPage(
            pageId,
            { title: revision.title, content: revision.content },
            actorId
        );
    } catch (error) {
        console.error(`Error restoring revision: ${revisionId}`, error);
        return { error: "Failed to restore revision" };
    }
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

export async function toggleWikiPageStar(pageId: string, trooperId: string) {
    try {
        const existing = await db.query.wikiPageStars.findFirst({
            where: and(
                eq(wikiPageStars.pageId, pageId),
                eq(wikiPageStars.trooperId, trooperId)
            ),
        });

        if (existing) {
            await db
                .delete(wikiPageStars)
                .where(
                    and(
                        eq(wikiPageStars.pageId, pageId),
                        eq(wikiPageStars.trooperId, trooperId)
                    )
                );
            return { starred: false };
        }

        await db.insert(wikiPageStars).values({ pageId, trooperId });
        return { starred: true };
    } catch (error) {
        console.error(`Error toggling star for page: ${pageId}`, error);
        return { error: "Failed to toggle star" };
    }
}

export async function isPageStarred(
    pageId: string,
    trooperId: string
): Promise<boolean> {
    try {
        const existing = await db.query.wikiPageStars.findFirst({
            where: and(
                eq(wikiPageStars.pageId, pageId),
                eq(wikiPageStars.trooperId, trooperId)
            ),
        });
        return !!existing;
    } catch (error) {
        console.error(`Error checking star for page: ${pageId}`, error);
        return false;
    }
}

export async function getStarredPages(trooperId: string) {
    try {
        return await db
            .select({
                pageId: wikiPages.id,
                title: wikiPages.title,
                collectionId: wikiPages.collectionId,
            })
            .from(wikiPageStars)
            .innerJoin(wikiPages, eq(wikiPageStars.pageId, wikiPages.id))
            .where(eq(wikiPageStars.trooperId, trooperId));
    } catch (error) {
        console.error(
            `Error fetching starred pages for trooper: ${trooperId}`,
            error
        );
        return [];
    }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface WikiSearchResult {
    id: string;
    title: string;
    collectionId: string;
    snippet: string;
    rank: number;
}

// readableCollectionIds gates which collections show up at all; editableCollectionIds
// (a subset) additionally surfaces drafts, since only editors should see unpublished pages.
export async function searchWikiPages(
    query: string,
    readableCollectionIds: string[],
    editableCollectionIds: string[] = []
): Promise<WikiSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed || readableCollectionIds.length === 0) return [];

    try {
        const readableIn = sql.join(
            readableCollectionIds.map((id) => sql`${id}`),
            sql`, `
        );
        const draftVisibleClause =
            editableCollectionIds.length > 0
                ? sql`OR collection_id IN (${sql.join(
                      editableCollectionIds.map((id) => sql`${id}`),
                      sql`, `
                  )})`
                : sql``;

        const result = await db.execute(sql`
            SELECT id, title, collection_id AS "collectionId",
                   ts_headline('english', content_text, websearch_to_tsquery('english', ${trimmed}),
                               'MaxWords=20, MinWords=10') AS snippet,
                   ts_rank(search_vector, websearch_to_tsquery('english', ${trimmed})) AS rank
            FROM wiki_pages
            WHERE search_vector @@ websearch_to_tsquery('english', ${trimmed})
              AND collection_id IN (${readableIn})
              AND (is_published = true ${draftVisibleClause})
            ORDER BY rank DESC
            LIMIT 20
        `);
        return result.rows as unknown as WikiSearchResult[];
    } catch (error) {
        console.error("Error searching wiki pages:", error);
        return [];
    }
}

// Lightweight title search for the editor's [[ page-link picker — a plain
// ilike prefix/substring match, distinct from searchWikiPages' full-text
// search (which is overkill for "start typing a title").
export async function searchWikiPagesByTitle(
    query: string,
    readableCollectionIds: string[],
    limit = 10
) {
    const trimmed = query.trim();
    if (!trimmed || readableCollectionIds.length === 0) return [];

    try {
        return await db
            .select({
                id: wikiPages.id,
                title: wikiPages.title,
                collectionId: wikiPages.collectionId,
                collectionSlug: wikiCollections.slug,
            })
            .from(wikiPages)
            .innerJoin(wikiCollections, eq(wikiPages.collectionId, wikiCollections.id))
            .where(
                and(
                    inArray(wikiPages.collectionId, readableCollectionIds),
                    eq(wikiPages.isPublished, true),
                    ilike(wikiPages.title, `%${trimmed}%`)
                )
            )
            .orderBy(asc(wikiPages.title))
            .limit(limit);
    } catch (error) {
        console.error("Error searching wiki pages by title:", error);
        return [];
    }
}

export async function getRecentlyUpdatedPages(
    readableCollectionIds: string[],
    limit = 8
) {
    if (readableCollectionIds.length === 0) return [];

    try {
        return await db
            .select({
                id: wikiPages.id,
                title: wikiPages.title,
                collectionId: wikiPages.collectionId,
                updatedAt: wikiPages.updatedAt,
            })
            .from(wikiPages)
            .where(
                and(
                    inArray(wikiPages.collectionId, readableCollectionIds),
                    eq(wikiPages.isPublished, true)
                )
            )
            .orderBy(desc(wikiPages.updatedAt))
            .limit(limit);
    } catch (error) {
        console.error("Error fetching recently updated wiki pages:", error);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Backlinks
// ---------------------------------------------------------------------------

export async function getPageBacklinks(pageId: string) {
    try {
        return await db
            .select({
                id: wikiPages.id,
                title: wikiPages.title,
                collectionId: wikiPages.collectionId,
            })
            .from(wikiPageLinks)
            .innerJoin(wikiPages, eq(wikiPageLinks.sourcePageId, wikiPages.id))
            .where(
                and(
                    eq(wikiPageLinks.targetPageId, pageId),
                    eq(wikiPages.isPublished, true)
                )
            );
    } catch (error) {
        console.error(`Error fetching backlinks for page: ${pageId}`, error);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Mentions
// ---------------------------------------------------------------------------

export async function searchTroopersForMention(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
        const rows = await db
            .select({
                id: troopers.id,
                name: troopers.name,
                numbers: troopers.numbers,
                rankAbbr: ranks.abbreviation,
            })
            .from(troopers)
            .leftJoin(ranks, eq(troopers.rank, ranks.id))
            .where(
                and(
                    not(eq(troopers.status, "Discharged")),
                    ilike(troopers.name, `%${trimmed}%`)
                )
            )
            .orderBy(asc(troopers.numbers))
            .limit(10);

        return rows.map((trooper) => ({
            id: trooper.id,
            fullName: getFullTrooperName(trooper),
        }));
    } catch (error) {
        console.error("Error searching troopers for mention:", error);
        return [];
    }
}
