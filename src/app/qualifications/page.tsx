import { db } from "@/db";
import { departments, departmentPositions, departmentAssignments, troopers, ranks } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getQualificationOptions } from "@/services/qualifications";
import QualificationsGrid from "./_components/qualifications-grid";
import DepartmentsGrid from "./_components/departments-grid";

export const dynamic = "force-dynamic";

type DepartmentLead = { name: string; numbers: number; rankAbbr: string | null; role: string };
type DepartmentRow = { name: string; description: string | null; lead: DepartmentLead | null };

async function getDepartments(): Promise<DepartmentRow[]> {
    const rows = await db
        .select({
            departmentId: departments.id,
            departmentName: departments.name,
            departmentDescription: departments.description,
            departmentPriority: departments.priority,
            positionPriority: departmentPositions.priority,
            positionRole: departmentPositions.role,
            trooperName: troopers.name,
            trooperNumbers: troopers.numbers,
            rankAbbr: ranks.abbreviation,
        })
        .from(departments)
        .leftJoin(departmentPositions, eq(departmentPositions.departmentId, departments.id))
        .leftJoin(departmentAssignments, eq(departmentAssignments.departmentPositionId, departmentPositions.id))
        .leftJoin(troopers, eq(troopers.id, departmentAssignments.trooperId))
        .leftJoin(ranks, eq(ranks.id, troopers.rank))
        .orderBy(asc(departments.priority), asc(departmentPositions.priority));

    const map = new Map<string, DepartmentRow>();
    for (const row of rows) {
        if (!map.has(row.departmentId)) {
            map.set(row.departmentId, {
                name: row.departmentName,
                description: row.departmentDescription,
                lead: null,
            });
        }
        const dept = map.get(row.departmentId)!;
        // First row per department that has an assigned trooper = department lead
        if (!dept.lead && row.trooperName && row.trooperNumbers !== null && row.positionRole) {
            dept.lead = {
                name: row.trooperName,
                numbers: row.trooperNumbers,
                rankAbbr: row.rankAbbr ?? null,
                role: row.positionRole,
            };
        }
    }
    return Array.from(map.values());
}

export default async function WhatWeOfferPage() {
    const [quals, depts] = await Promise.all([
        getQualificationOptions(),
        getDepartments(),
    ]);

    return (
        <div className="min-h-screen">
            {/* ── Hero ────────────────────────────────────────────────────── */}
            <div className="relative bg-background border-b border-border overflow-hidden py-10">
                <div
                    className="absolute inset-0 opacity-[0.1] dark:opacity-[0.28]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                        maskImage:
                            "radial-gradient(ellipse 90% 100% at 50% 50%, black 0%, black 20%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse 90% 100% at 50% 50%, black 0%, black 20%, transparent 80%)",
                    }}
                />
                <div className="relative container mx-auto px-4">
                    <p className="text-xs font-semibold tracking-[0.4em] uppercase text-muted-foreground mb-1">
                        9th Assault Corps
                    </p>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase text-[#993534]">
                        What We Offer
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 space-y-14">

                {/* ── Qualifications ──────────────────────────────────────── */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold tracking-tight">Qualifications</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Training paths available to all members of the 9th Assault Corps.
                        </p>
                    </div>
                    <QualificationsGrid quals={quals} />
                </section>

                {/* ── Departments ─────────────────────────────────────────── */}
                {depts.length > 0 && (
                    <section>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold tracking-tight">Departments</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Staff departments and the positions that support the 9th Assault Corps.
                            </p>
                        </div>
                        <DepartmentsGrid depts={depts} />
                    </section>
                )}
            </div>
        </div>
    );
}
