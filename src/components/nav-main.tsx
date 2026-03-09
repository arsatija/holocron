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
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { ChevronRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

type QualCategory =
    | "Standard"
    | "Medical"
    | "Advanced"
    | "Aviation"
    | "Detachments"
    | "Leadership"
    | "Zeus";

const QUAL_CATEGORIES: QualCategory[] = [
    "Standard",
    "Medical",
    "Advanced",
    "Aviation",
    "Detachments",
    "Leadership",
    "Zeus",
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
        {} as Record<QualCategory, Qualification[]>,
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

    return (
        <div className="flex items-center">
            {/* Unit + Training + Admin all in one NavigationMenu — Unit is first so viewport aligns naturally */}
            <NavigationMenu>
                <NavigationMenuList>
                    {/* Unit dropdown */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>Unit</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <div className="w-[200px] p-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2">
                                    9th Assault Corps
                                </p>
                                {[
                                    { label: "ORBAT", href: "/orbat" },
                                    { label: "Roster", href: "/roster" },
                                    { label: "Unit Info", href: "/unit" },
                                    { label: "Offerings", href: "/offerings" },
                                ].map(({ label, href }) => (
                                    <NavigationMenuLink key={href} asChild>
                                        <Link
                                            href={href}
                                            className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                        >
                                            {label}
                                        </Link>
                                    </NavigationMenuLink>
                                ))}
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Admin dropdown */}
                    {canAdmin && (
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
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

                    {/* Training dropdown */}
                    {canTraining && (
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>
                                Training
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <div className="flex w-[520px]">
                                    {/* Left: category list */}
                                    <div className="w-[180px] border-r p-2 flex flex-col gap-0.5">
                                        <div className="pb-1 mb-1 border-b">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    href="/training/new"
                                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                                >
                                                    <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                                    Training Form
                                                </Link>
                                            </NavigationMenuLink>
                                        </div>
                                        {QUAL_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                className={cn(
                                                    "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors text-left",
                                                    "hover:bg-accent hover:text-accent-foreground",
                                                    activeCategory === cat &&
                                                        "bg-accent text-accent-foreground font-medium",
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
                                                    No qualifications in this
                                                    category.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    )}
                </NavigationMenuList>
            </NavigationMenu>

            {/* Plain links */}
            {[
                { name: "Campaigns", href: "/campaigns" },
                { name: "Events", href: "/events" },
            ].map((item) => (
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
        </div>
    );
};

export default NavMain;
