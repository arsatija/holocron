"use client";

import { useState } from "react";
import QualificationsGrid from "./qualifications-grid";
import DepartmentsGrid from "./departments-grid";

type Qual = {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
    rankRequirement: string;
    description: string | null | undefined;
};

type DepartmentLead = { name: string; numbers: number; rankAbbr: string | null; role: string };
type Department = { name: string; description: string | null; lead: DepartmentLead | null };

type Tab = "qualifications" | "departments";

const TABS: { id: Tab; label: string }[] = [
    { id: "qualifications", label: "Qualifications" },
    { id: "departments", label: "Departments" },
];

export default function OfferingsTabs({
    quals,
    depts,
}: {
    quals: Qual[];
    depts: Department[];
}) {
    const [active, setActive] = useState<Tab>("qualifications");

    return (
        <>
            {/* ── Tab bar (ORBAT style) ──────────────────────────────────── */}
            <div className="flex w-full border-b border-border">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActive(tab.id)}
                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                            active === tab.id
                                ? "border-[#993534] text-[#993534]"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab content ───────────────────────────────────────────── */}
            <div className="container mx-auto px-4 py-8 md:py-10">
                {active === "qualifications" && (
                    <section>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold tracking-tight">Qualifications</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Training paths available to all members of the 9th Assault Corps.
                            </p>
                        </div>
                        <QualificationsGrid quals={quals} />
                    </section>
                )}

                {active === "departments" && (
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
        </>
    );
}
