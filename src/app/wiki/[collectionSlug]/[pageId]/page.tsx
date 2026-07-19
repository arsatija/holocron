import { notFound } from "next/navigation";
import { Pin } from "lucide-react";
import { WikiEditor } from "@/components/tiptap/wiki-editor";
import { getWikiPageData } from "../../_lib/queries";
import { WikiBreadcrumbs } from "../../_components/wiki-breadcrumbs";
import { StarButton } from "../../_components/star-button";
import { BacklinksPanel } from "../../_components/backlinks-panel";
import { PageViewActions } from "../../_components/page-view-actions";
import { UpdatedAt } from "../../_components/updated-at";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function WikiPageView({
    params,
}: {
    params: Promise<{ collectionSlug: string; pageId: string }>;
}) {
    const { collectionSlug, pageId } = await params;
    const data = await getWikiPageData(collectionSlug, pageId);
    if (!data) notFound();

    const { ctx, collection, page, ancestors, backlinks, starred, canEdit, canManage } = data;

    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <WikiBreadcrumbs
                    collection={collection}
                    ancestors={ancestors}
                    currentTitle={page.title}
                />
                {canEdit && (
                    <PageViewActions
                        pageId={page.id}
                        collectionSlug={collection.slug}
                        isPublished={page.isPublished}
                        isPinned={page.isPinned}
                        canManage={canManage}
                    />
                )}
            </div>

            {!page.isPublished && (
                <div className="mt-4 rounded-md border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                    This page is a draft — only editors can see it.
                </div>
            )}

            <h1 className="flex flex-wrap items-center gap-1.5 text-3xl font-extrabold tracking-tight mt-4">
                <span className="text-accent9th mr-0.5">//</span>
                {page.title}
                {ctx && <StarButton pageId={page.id} initialStarred={starred} />}
                {page.isPinned && (
                    <Pin className="h-4 w-4 shrink-0 fill-accent9th text-accent9th" />
                )}
                {!page.isPublished && <Badge variant="outline">Draft</Badge>}
            </h1>

            <UpdatedAt date={page.updatedAt.toISOString()} name={page.lastEditedByName} />

            <div className="mt-3 border-t border-accent9th/20" />

            <div className="mt-6">
                <WikiEditor value={page.content} editable={false} />
            </div>

            <BacklinksPanel backlinks={backlinks} />
        </div>
    );
}
