"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WikiSidebar } from "./wiki-sidebar";
import type {
    PermissionOption,
    PinnedSidebarPage,
    SidebarCollection,
    StarredSidebarPage,
} from "../_lib/queries";

interface WikiMobileSidebarProps {
    collections: SidebarCollection[];
    canManage: boolean;
    permissionOptions: PermissionOption[];
    starred: StarredSidebarPage[];
    pinned: PinnedSidebarPage[];
    starredIds: Set<string>;
}

// Desktop gets the persistent WikiSidebar column (see layout.tsx); on small
// screens that same component is reused inside a slide-over Sheet instead,
// triggered by this button. Auto-closes on navigation since WikiSidebar's
// many nested links (tree nodes, starred/pinned pages, etc.) aren't each
// individually wrapped in SheetClose.
export function WikiMobileSidebar(props: WikiMobileSidebarProps) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden mb-4">
                    <Menu className="h-4 w-4 mr-1.5" />
                    Browse Wiki
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
                <SheetTitle className="sr-only">Wiki Navigation</SheetTitle>
                <WikiSidebar {...props} className="w-full border-0 pr-0" />
            </SheetContent>
        </Sheet>
    );
}
