import { notFound } from "next/navigation";
import { getCollectionPageData, getPermissionOptions } from "../_lib/queries";
import { CollectionActions } from "./_components/collection-actions";
import { PageTree } from "../_components/page-tree";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
    params,
}: {
    params: Promise<{ collectionSlug: string }>;
}) {
    const { collectionSlug } = await params;
    const data = await getCollectionPageData(collectionSlug);
    if (!data) notFound();

    const { collection, tree, canEdit, canManage, starredIds } = data;
    const permissionOptions = canManage ? await getPermissionOptions() : [];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="pl-3">
                    <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                        {/* <span className="text-accent9th">//</span> */}
                        <span>{collection.icon || "📄"}</span>
                        {collection.name}
                    </h1>
                    {collection.description && (
                        <p className="text-muted-foreground text-sm mt-1">
                            {collection.description}
                        </p>
                    )}
                </div>
                {(canEdit || canManage) && (
                    <CollectionActions
                        collection={collection}
                        permissionOptions={permissionOptions}
                        canEdit={canEdit}
                        canManage={canManage}
                    />
                )}
            </div>

            <div className="border-t border-accent9th/20" />

            <PageTree
                nodes={tree}
                collectionId={collection.id}
                collectionSlug={collection.slug}
                canEdit={canEdit}
                canManage={canManage}
                starredIds={starredIds}
                emptyLabel="No pages yet in this collection."
            />
        </div>
    );
}
