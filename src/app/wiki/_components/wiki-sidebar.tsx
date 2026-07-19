"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CollectionFormDialog } from "./collection-form-dialog";
import type { PermissionOption } from "../_lib/queries";
import type { WikiCollection } from "@/db/schema";

interface WikiSidebarProps {
    collections: WikiCollection[];
    canManage: boolean;
    permissionOptions: PermissionOption[];
}

export function WikiSidebar({
    collections,
    canManage,
    permissionOptions,
}: WikiSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [formOpen, setFormOpen] = useState(false);

    return (
        <div className="w-64 shrink-0 border-r pr-4 space-y-4">
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
                <nav className="flex flex-col gap-0.5">
                    {collections.length === 0 && (
                        <p className="px-2 py-1.5 text-sm text-muted-foreground">
                            No collections yet.
                        </p>
                    )}
                    {collections.map((collection) => {
                        const href = `/wiki/${collection.slug}`;
                        const active = pathname.startsWith(href);
                        return (
                            <Link
                                key={collection.id}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm truncate transition-colors",
                                    active
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <span className="shrink-0">{collection.icon || "📄"}</span>
                                <span className="truncate">{collection.name}</span>
                            </Link>
                        );
                    })}
                </nav>
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
