"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { RankLevel } from "@/lib/types";
import { ProtectedNavItem } from "./protected-nav-item";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QualCategory =
    | "Standard"
    | "Medical"
    | "Advanced"
    | "Aviation"
    | "Detachments"
    | "Leadership";

const QUAL_CATEGORIES: QualCategory[] = [
    "Standard",
    "Medical",
    "Advanced",
    "Aviation",
    "Detachments",
    "Leadership",
];

type Qualification = {
    id: string;
    name: string;
    abbreviation: string;
    category: QualCategory;
};

const NavMain = () => {
    const { trooperCtx } = useController();
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [activeCategory, setActiveCategory] =
        useState<QualCategory>("Standard");

    useEffect(() => {
        fetch("/api/v1/qualificationList")
            .then((res) => res.json())
            .then((data: Qualification[]) => setQualifications(data))
            .catch(() => {});
    }, []);

    const qualsByCategory = QUAL_CATEGORIES.reduce<
        Record<QualCategory, Qualification[]>
    >(
        (acc, cat) => {
            acc[cat] = qualifications.filter((q) => q.category === cat);
            return acc;
        },
        {} as Record<QualCategory, Qualification[]>
    );

    const canTraining = checkPermissionsSync(trooperCtx, [
        "Training",
        RankLevel.Company,
        RankLevel.Command,
    ]);
    const canAdmin = checkPermissionsSync(trooperCtx, [
        RankLevel.Company,
        RankLevel.Command,
        "Admin",
    ]);

    const simpleNavItems = [
        { name: "ORBAT", href: "/orbat" },
        { name: "Roster", href: "/roster" },
        { name: "Campaigns", href: "/campaigns" },
    ];

    return (
        <div className="flex items-center">
            {/* Plain links rendered outside NavigationMenu — no dropdown, no viewport offset issues */}
            {simpleNavItems.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    className={navigationMenuTriggerStyle()}
                >
                    {item.name}
                </Link>
            ))}
            {trooperCtx && (
                <Link
                    href="/recruitment"
                    className={navigationMenuTriggerStyle()}
                >
                    Recruitment
                </Link>
            )}

            {/* Training + Admin share one NavigationMenu so the viewport's left edge
                starts under Training (the first item) and the slide animation is preserved */}
            {(canTraining || canAdmin) && (
                <NavigationMenu>
                    <NavigationMenuList>
                        {canTraining && (
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>
                                    Training
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="flex w-[520px]">
                                        {/* Left: category list */}
                                        <div className="w-[180px] border-r p-2 flex flex-col gap-0.5">
                                            {QUAL_CATEGORIES.map((cat) => (
                                                <button
                                                    key={cat}
                                                    className={cn(
                                                        "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors text-left",
                                                        "hover:bg-accent hover:text-accent-foreground",
                                                        activeCategory ===
                                                            cat &&
                                                            "bg-accent text-accent-foreground font-medium"
                                                    )}
                                                    onMouseEnter={() =>
                                                        setActiveCategory(cat)
                                                    }
                                                >
                                                    {cat}
                                                    <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
                                                </button>
                                            ))}
                                            <div className="border-t mt-1 pt-1">
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/training"
                                                        className="flex items-center px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    >
                                                        Training History
                                                    </Link>
                                                </NavigationMenuLink>
                                            </div>
                                        </div>

                                        {/* Right: qualifications for active category */}
                                        <div className="flex-1 p-3">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">
                                                {activeCategory}
                                            </p>
                                            <div className="flex flex-col gap-0.5">
                                                {qualsByCategory[activeCategory]
                                                    ?.length > 0 ? (
                                                    qualsByCategory[
                                                        activeCategory
                                                    ].map((qual) => (
                                                        <NavigationMenuLink
                                                            key={qual.id}
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/qualifications/${qual.id}`}
                                                                className="flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors group"
                                                            >
                                                                <span className="font-mono text-xs text-muted-foreground group-hover:text-inherit w-10 shrink-0">
                                                                    {
                                                                        qual.abbreviation
                                                                    }
                                                                </span>
                                                                {qual.name}
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-muted-foreground px-2 py-2">
                                                        No qualifications in
                                                        this category.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        )}

                        {canAdmin && (
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>
                                    Admin
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className="w-[200px] p-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2">
                                            Administration
                                        </p>
                                        <NavigationMenuLink asChild>
                                            <Link
                                                href="/admin/operations"
                                                className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                            >
                                                Operations
                                            </Link>
                                        </NavigationMenuLink>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        )}
                    </NavigationMenuList>
                </NavigationMenu>
            )}
        </div>
    );
};

export default NavMain;
