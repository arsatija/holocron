import { WikiSidebar } from "./_components/wiki-sidebar";
import { WikiMobileSidebar } from "./_components/wiki-mobile-sidebar";
import { getWikiSidebarData, getPermissionOptions } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function WikiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { collections, canManage, starred, pinned, starredIds } = await getWikiSidebarData();
    const permissionOptions = canManage ? await getPermissionOptions() : [];
    const sidebarProps = { collections, canManage, permissionOptions, starred, pinned, starredIds };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex gap-8">
                <div className="hidden md:block">
                    <WikiSidebar {...sidebarProps} />
                </div>
                <div className="flex-1 min-w-0">
                    <WikiMobileSidebar {...sidebarProps} />
                    {children}
                </div>
            </div>
        </div>
    );
}
