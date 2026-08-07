"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { ChevronRight, ClipboardList, Settings2 } from "lucide-react";
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

    type MedicSnapshotEntry = { id: string; name: string; count: number };
    const [medicSnapshot, setMedicSnapshot] = useState<MedicSnapshotEntry[]>([]);
    const [activeNco, setActiveNco] = useState<string>("medic-attendance");

    useEffect(() => {
        fetch("/api/v1/medicAttendanceSnapshot")
            .then((res) => res.json())
            .then((data: MedicSnapshotEntry[]) => setMedicSnapshot(data))
            .catch(() => {});
    }, []);

    const NCO_PAGES = [
        {
            key: "medic-attendance",
            label: "Medic Attendance",
            href: "/nco/medic-attendance",
        },
    ];

    const qualsByCategory = QUAL_CATEGORIES.reduce<
        Record<QualCategory, Qualification[]>
    >(
        (acc, cat) => {
            acc[cat] = qualifications.filter((q) => q.category === cat);
            return acc;
        },
        {} as Record<QualCategory, Qualification[]>,
    );

    const [showManagement, setShowManagement] = useState(false);

    const canTraining = checkPermissionsSync(trooperCtx, [
        "Training",
        RankLevel.Company,
        RankLevel.Command,
    ]);
    const canMedia = checkPermissionsSync(trooperCtx, [
        "Admin",
        RankLevel.SNCO,
        RankLevel.Company,
        RankLevel.Command,
    ]);
    const canAdmin = checkPermissionsSync(trooperCtx, [
        RankLevel.Company,
        RankLevel.Command,
        "Admin",
    ]);
    const canNco = checkPermissionsSync(trooperCtx, [
        RankLevel.JNCO,
        RankLevel.SNCO,
        RankLevel.Company,
        RankLevel.Command,
    ]);
    const canManagement = checkPermissionsSync(trooperCtx, [
        RankLevel.Command,
        "admin:2ic",
        "admin:lead",
    ]);

    return (
        <div className="flex items-center">
            {/* Unit + Training + Admin all in one NavigationMenu — Unit is first so viewport aligns naturally */}
            <NavigationMenu onValueChange={(value) => { if (!value) setShowManagement(false); }}>
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
                                <div className={cn("flex", canManagement && showManagement ? "w-[380px]" : "w-[200px]")} onMouseLeave={() => setShowManagement(false)}>
                                    {/* Left column */}
                                    <div className={cn("p-2 flex flex-col gap-0.5", canManagement && showManagement ? "w-[190px] border-r" : "w-full")}>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2">
                                            Administration
                                        </p>
                                        <div onMouseEnter={() => setShowManagement(false)}>
                                        {[
                                            { label: "Operations", href: "/admin/operations" },
                                            { label: "Audit Log", href: "/admin/audit" },
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
                                        {canManagement && (
                                            <div className="border-t mt-1 pt-1">
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/admin/management"
                                                        className={cn(
                                                            "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                                                            "hover:bg-accent hover:text-accent-foreground",
                                                            showManagement && "bg-accent text-accent-foreground font-medium"
                                                        )}
                                                        onMouseEnter={() => setShowManagement(true)}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Settings2 className="h-3.5 w-3.5" />
                                                            Management
                                                        </span>
                                                        <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
                                                    </Link>
                                                </NavigationMenuLink>
                                            </div>
                                        )}
                                    </div>
                                    {/* Right column: management sub-pages */}
                                    {canManagement && showManagement && (
                                        <div className="flex-1 p-3">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">
                                                Management
                                            </p>
                                            <div className="flex flex-col gap-0.5">
                                                {[
                                                    { label: "Ranks", href: "/admin/management/ranks" },
                                                    { label: "Medals", href: "/admin/management/medals" },
                                                    { label: "Departments", href: "/admin/management/departments" },
                                                    { label: "Unit Elements", href: "/admin/management/unit-elements" },
                                                    { label: "Dept Positions", href: "/admin/management/department-positions" },
                                                    { label: "Billets", href: "/admin/management/billets" },
                                                    { label: "Qualifications", href: "/admin/management/qualifications" },
                                                ].map(({ label, href }) => (
                                                    <NavigationMenuLink key={href} asChild>
                                                        <Link
                                                            href={href}
                                                            className="flex items-center px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                                        >
                                                            {label}
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    )}

                    {/* NCO dropdown */}
                    {canNco && (
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>NCO</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <div className="flex w-[420px]">
                                    {/* Left: page list */}
                                    <div className="w-[180px] border-r p-2 flex flex-col gap-0.5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2">
                                            NCO
                                        </p>
                                        {NCO_PAGES.map((action) => (
                                            <NavigationMenuLink key={action.key} asChild>
                                                <Link
                                                    href={action.href}
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left",
                                                        "hover:bg-accent hover:text-accent-foreground",
                                                        activeNco === action.key &&
                                                            "bg-accent text-accent-foreground font-medium",
                                                    )}
                                                    onMouseEnter={() =>
                                                        setActiveNco(action.key)
                                                    }
                                                >
                                                    {action.label}
                                                    <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
                                                </Link>
                                            </NavigationMenuLink>
                                        ))}
                                    </div>

                                    {/* Right: snapshot preview */}
                                    <div className="flex-1 p-3">
                                        {activeNco === "medic-attendance" && (
                                            <>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-2">
                                                    Medic Attendance
                                                </p>
                                                <div className="flex flex-col gap-0.5 max-h-[280px] overflow-y-auto">
                                                    {medicSnapshot.length > 0 ? (
                                                        medicSnapshot.map((medic) => (
                                                            <div
                                                                key={medic.id}
                                                                className="flex items-center justify-between px-2 py-1.5 rounded-md text-sm"
                                                            >
                                                                <span className="truncate">
                                                                    {medic.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                                    {medic.count}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground px-2 py-2">
                                                            No medic attendance logged yet.
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
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
            {canMedia && (
                <Link
                    href="/media"
                    className={navigationMenuTriggerStyle()}
                >
                    Media
                </Link>
            )}
        </div>
    );
};

export default NavMain;
