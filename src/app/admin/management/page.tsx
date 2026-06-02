import Link from "next/link";
import { Medal, Building2, Layers, Briefcase, ListTree } from "lucide-react";

const sections = [
    {
        title: "Ranks",
        description: "Manage rank grades, levels, and promotion order.",
        href: "/admin/management/ranks",
        icon: Medal,
    },
    {
        title: "Departments",
        description: "Manage department hierarchy and permission scopes.",
        href: "/admin/management/departments",
        icon: Building2,
    },
    {
        title: "Unit Elements",
        description: "Manage the ORBAT unit element structure.",
        href: "/admin/management/unit-elements",
        icon: Layers,
    },
    {
        title: "Department Positions",
        description: "Manage roles and positions within each department.",
        href: "/admin/management/department-positions",
        icon: ListTree,
    },
    {
        title: "Billets",
        description: "Manage billet slots within unit elements.",
        href: "/admin/management/billets",
        icon: Briefcase,
    },
];

export default function ManagementPage() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => {
                const Icon = section.icon;
                return (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="group flex flex-col gap-3 rounded-lg border p-5 hover:bg-accent transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <h2 className="font-semibold">{section.title}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                    </Link>
                );
            })}
        </div>
    );
}
