import { notFound } from "next/navigation";
import { getWikiPageData } from "../../../_lib/queries";
import { WikiPageEditor } from "../../../_components/wiki-page-editor";

export const dynamic = "force-dynamic";

export default async function WikiPageEditRoute({
    params,
}: {
    params: Promise<{ collectionSlug: string; pageId: string }>;
}) {
    const { collectionSlug, pageId } = await params;
    const data = await getWikiPageData(collectionSlug, pageId);
    if (!data || !data.canEdit) notFound();

    const { collection, page } = data;

    return (
        <div className="h-full overflow-y-auto">
        <WikiPageEditor
            pageId={page.id}
            collectionSlug={collection.slug}
            initialTitle={page.draftTitle ?? page.title}
            initialContent={page.draftContent ?? page.content}
            publishedTitle={page.title}
            publishedContent={page.content}
            isPublished={page.isPublished}
            hasDraft={page.draftContent !== null}
            draftSavedAt={page.draftSavedAt?.toISOString() ?? null}
        />
        </div>
    );
}
