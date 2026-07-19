import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getPageHistoryData, getRevisionData } from "../../../_lib/queries";
import { WikiBreadcrumbs } from "../../../_components/wiki-breadcrumbs";
import { RestoreRevisionButton } from "../../../_components/restore-revision-button";
import { WikiEditor } from "@/components/tiptap/wiki-editor";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WikiPageHistory({
    params,
    searchParams,
}: {
    params: Promise<{ collectionSlug: string; pageId: string }>;
    searchParams: Promise<{ revision?: string }>;
}) {
    const { collectionSlug, pageId } = await params;
    const { revision: revisionId } = await searchParams;

    const data = await getPageHistoryData(collectionSlug, pageId);
    if (!data) notFound();

    const { collection, page, revisions, ancestors } = data;

    const selected = revisionId
        ? await getRevisionData(collectionSlug, pageId, revisionId)
        : null;

    return (
        <div className="h-full overflow-y-auto">
        <div className="space-y-4 max-w-5xl">
            <WikiBreadcrumbs
                collection={collection}
                ancestors={ancestors}
                currentTitle={`${page.title} — History`}
            />

            <h1 className="text-2xl font-bold tracking-tight">Revision History</h1>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-64 md:shrink-0 space-y-1">
                    <Link
                        href={`/wiki/${collectionSlug}/${pageId}`}
                        className="block px-3 pb-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        ← Back to page
                    </Link>
                    {revisions.length === 0 ? (
                        <p className="px-3 text-sm text-muted-foreground">
                            No revisions yet — edits create one automatically.
                        </p>
                    ) : (
                        revisions.map((rev) => {
                            const href = `/wiki/${collectionSlug}/${pageId}/history?revision=${rev.id}`;
                            const active = rev.id === revisionId;
                            return (
                                <Link
                                    key={rev.id}
                                    href={href}
                                    className={cn(
                                        "block rounded-md px-3 py-2 text-sm transition-colors",
                                        active
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <p className="font-medium truncate">{rev.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(rev.createdAt, "PPp")}
                                        {rev.editedByName && ` · ${rev.editedByName}`}
                                    </p>
                                </Link>
                            );
                        })
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {selected ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold truncate">
                                    {selected.revision.title}
                                </h2>
                                <RestoreRevisionButton
                                    pageId={pageId}
                                    revisionId={selected.revision.id}
                                    collectionSlug={collectionSlug}
                                />
                            </div>
                            <WikiEditor value={selected.revision.content} editable={false} />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Select a revision on the left to preview it.
                        </p>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}
