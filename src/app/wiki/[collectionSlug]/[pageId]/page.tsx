import { notFound } from "next/navigation";
import { WikiEditor } from "@/components/tiptap/wiki-editor";
import { getWikiPageData } from "../../_lib/queries";
import { WikiBreadcrumbs } from "../../_components/wiki-breadcrumbs";
import { StarButton } from "../../_components/star-button";
import { BacklinksPanel } from "../../_components/backlinks-panel";
import { PageViewActions } from "../../_components/page-view-actions";
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

    const { ctx, collection, page, ancestors, backlinks, starred, canEdit } = data;

    return (
        <div className="space-y-4 max-w-4xl">
            <WikiBreadcrumbs
                collection={collection}
                ancestors={ancestors}
                currentTitle={page.title}
            />

            {!page.isPublished && (
                <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                    This page is a draft — only editors can see it.
                </div>
            )}

            <div className="flex items-start justify-between gap-4">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    {page.title}
                    {!page.isPublished && <Badge variant="outline">Draft</Badge>}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                    {ctx && <StarButton pageId={page.id} initialStarred={starred} />}
                    {canEdit && (
                        <PageViewActions
                            pageId={page.id}
                            collectionSlug={collection.slug}
                            isPublished={page.isPublished}
                        />
                    )}
                </div>
            </div>

            {page.lastEditedByName && (
                <p className="text-xs text-muted-foreground">
                    Last edited by {page.lastEditedByName}
                </p>
            )}

            <WikiEditor value={page.content} editable={false} />

            <BacklinksPanel backlinks={backlinks} />
        </div>
    );
}
