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
        <WikiPageEditor
            pageId={page.id}
            collectionSlug={collection.slug}
            initialTitle={page.title}
            initialContent={page.content}
            isPublished={page.isPublished}
        />
    );
}
