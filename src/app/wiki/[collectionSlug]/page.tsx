import { notFound } from "next/navigation";
import { getCollectionPageData, getPermissionOptions } from "../_lib/queries";
import { CollectionActions } from "./_components/collection-actions";
import { PageTreeView } from "./_components/page-tree-view";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
    params,
}: {
    params: Promise<{ collectionSlug: string }>;
}) {
    const { collectionSlug } = await params;
    const data = await getCollectionPageData(collectionSlug);
    if (!data) notFound();

    const { collection, tree, canManage } = data;
    const permissionOptions = canManage ? await getPermissionOptions() : [];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <span>{collection.icon || "📄"}</span>
                        {collection.name}
                    </h1>
                    {collection.description && (
                        <p className="text-muted-foreground text-sm mt-1">
                            {collection.description}
                        </p>
                    )}
                </div>
                {canManage && (
                    <CollectionActions
                        collection={collection}
                        permissionOptions={permissionOptions}
                    />
                )}
            </div>

            <PageTreeView nodes={tree} collectionSlug={collection.slug} />
        </div>
    );
}
