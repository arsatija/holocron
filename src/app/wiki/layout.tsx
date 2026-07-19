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
        <div className="h-[calc(100dvh-4rem)] overflow-hidden">
            <div className="container mx-auto px-4 h-full flex gap-8">
                <div className="hidden md:block shrink-0 h-full overflow-y-auto py-8">
                    <WikiSidebar {...sidebarProps} />
                </div>
                <div className="flex-1 min-w-0 h-full overflow-hidden py-8">
                    <WikiMobileSidebar {...sidebarProps} />
                    {children}
                </div>
            </div>
        </div>
    );
}
