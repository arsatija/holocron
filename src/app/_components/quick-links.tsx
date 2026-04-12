import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon, Users, BookOpen, Target, Shield, GraduationCap } from "lucide-react";
import Link from "next/link";

const links = [
    { href: "/roster", label: "Roster", icon: Users, description: "Full unit roster" },
    { href: "/orbat", label: "ORBAT", icon: Shield, description: "Unit org chart" },
    { href: "/campaigns", label: "Campaigns", icon: Target, description: "Operations & events" },
    { href: "/qualifications", label: "Qualifications", icon: BookOpen, description: "Browse qualifications" },
    { href: "/training", label: "Training", icon: GraduationCap, description: "Training records" },
    { href: "/unit", label: "Who We Are", icon: LinkIcon, description: "Unit elements & billets" },
];

export default function QuickLinks() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Quick Links
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                {links.map(({ href, label, icon: Icon, description }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex flex-col gap-1 rounded-md border border-border p-3 hover:bg-accent transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {description}
                        </span>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
