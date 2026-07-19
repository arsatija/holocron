import { ProtectedRoute } from "@/components/protected-route";
import { WikiSidebar } from "./_components/wiki-sidebar";
import { getWikiSidebarData, getPermissionOptions } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function WikiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { collections, canManage, starred, pinned } = await getWikiSidebarData();
    const permissionOptions = canManage ? await getPermissionOptions() : [];

    return (
        <ProtectedRoute allowedPermissions={[]}>
            <div className="container mx-auto py-8">
                <div className="flex gap-8">
                    <WikiSidebar
                        collections={collections}
                        canManage={canManage}
                        permissionOptions={permissionOptions}
                        starred={starred}
                        pinned={pinned}
                    />
                    <div className="flex-1 min-w-0">{children}</div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
