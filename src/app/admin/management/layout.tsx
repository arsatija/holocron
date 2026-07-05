"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MANAGEMENT_SECTIONS = [
    { label: "Ranks", href: "/admin/management/ranks" },
    { label: "Medals", href: "/admin/management/medals" },
    { label: "Departments", href: "/admin/management/departments" },
    { label: "Unit Elements", href: "/admin/management/unit-elements" },
    { label: "Dept Positions", href: "/admin/management/department-positions" },
    { label: "Billets", href: "/admin/management/billets" },
    { label: "Qualifications", href: "/admin/management/qualifications" },
];

const MANAGEMENT_PERMISSIONS = [RankLevel.Command, "admin:2ic", "admin:lead"];

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <ProtectedRoute allowedPermissions={MANAGEMENT_PERMISSIONS}>
            <div className="container mx-auto py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Management</h1>
                    <p className="text-muted-foreground text-sm">Manage reference data for ranks, structure, and positions.</p>
                </div>
                <nav className="flex flex-wrap gap-2 border-b pb-4">
                    {MANAGEMENT_SECTIONS.map((section) => (
                        <Link
                            key={section.href}
                            href={section.href}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                                pathname.startsWith(section.href)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            {section.label}
                        </Link>
                    ))}
                </nav>
                {children}
            </div>
        </ProtectedRoute>
    );
}
