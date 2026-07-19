"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Pin, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CollectionFormDialog } from "./collection-form-dialog";
import { PageTree } from "./page-tree";
import { WikiSearchDialog } from "./wiki-search-dialog";
import type {
    PermissionOption,
    PinnedSidebarPage,
    SidebarCollection,
    StarredSidebarPage,
} from "../_lib/queries";

interface WikiSidebarProps {
    collections: SidebarCollection[];
    canManage: boolean;
    permissionOptions: PermissionOption[];
    starred: StarredSidebarPage[];
    pinned: PinnedSidebarPage[];
}

function SidebarPageLinks({
    label,
    icon,
    pages,
    activePathname,
}: {
    label: string;
    icon: React.ReactNode;
    pages: { pageId: string; title: string; collectionSlug: string }[];
    activePathname: string;
}) {
    if (pages.length === 0) return null;

    return (
        <div>
            <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </p>
            <div className="flex flex-col gap-0.5">
                {pages.map((page) => {
                    const href = `/wiki/${page.collectionSlug}/${page.pageId}`;
                    return (
                        <Link
                            key={page.pageId}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm truncate transition-colors",
                                activePathname === href
                                    ? "bg-accent text-accent-foreground font-medium"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            {icon}
                            <span className="truncate">{page.title}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export function WikiSidebar({
    collections,
    canManage,
    permissionOptions,
    starred,
    pinned,
}: WikiSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [formOpen, setFormOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    function toggle(id: string) {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <div className="w-72 shrink-0 border-r pr-4 space-y-4">
            <WikiSearchDialog />

            <Link
                href="/wiki"
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                    pathname === "/wiki"
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <BookOpen className="h-4 w-4" />
                Wiki Home
            </Link>

            <SidebarPageLinks
                label="Pinned"
                icon={<Pin className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
                pages={pinned}
                activePathname={pathname}
            />

            <SidebarPageLinks
                label="Starred"
                icon={<Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
                pages={starred}
                activePathname={pathname}
            />

            <div>
                <div className="flex items-center justify-between px-2 pb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Collections
                    </p>
                    {canManage && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => setFormOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                {collections.length === 0 && (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        No collections yet.
                    </p>
                )}

                <div className="flex flex-col gap-0.5">
                    {collections.map((collection) => {
                        const href = `/wiki/${collection.slug}`;
                        const active = pathname.startsWith(href);
                        // Auto-expand the collection you're currently browsing.
                        const isOpen = active || !collapsed.has(collection.id);

                        return (
                            <div key={collection.id}>
                                <div
                                    className={cn(
                                        "group flex items-center gap-1 rounded-md text-sm transition-colors",
                                        active
                                            ? "bg-accent text-accent-foreground font-medium"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggle(collection.id)}
                                        className="h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground"
                                    >
                                        <ChevronRight
                                            className={cn(
                                                "h-3 w-3 transition-transform",
                                                isOpen && "rotate-90"
                                            )}
                                        />
                                    </button>
                                    <Link
                                        href={href}
                                        className="flex-1 flex items-center gap-2 py-1.5 truncate"
                                    >
                                        <span className="shrink-0">{collection.icon || "📄"}</span>
                                        <span className="truncate">{collection.name}</span>
                                    </Link>
                                </div>
                                {isOpen && (
                                    <div className="pl-3">
                                        <PageTree
                                            nodes={collection.tree}
                                            collectionId={collection.id}
                                            collectionSlug={collection.slug}
                                            canEdit={collection.canEdit}
                                            emptyLabel="No pages yet."
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {canManage && (
                <CollectionFormDialog
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    permissionOptions={permissionOptions}
                    onSuccess={(slug) => {
                        router.refresh();
                        if (slug) router.push(`/wiki/${slug}`);
                    }}
                />
            )}
        </div>
    );
}
