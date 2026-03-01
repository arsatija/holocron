"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const TiptapEditor = dynamic(() => import("@/components/tiptap/editor"), {
    ssr: false,
});

type DepartmentLead = {
    name: string;
    numbers: number;
    rankAbbr: string | null;
    role: string;
};

type Department = {
    name: string;
    description: string | null;
    lead: DepartmentLead | null;
};

interface CardRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export default function DepartmentsGrid({ depts }: { depts: Department[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<Department | null>(null);
    const [originRect, setOriginRect] = useState<CardRect | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);

    const handleCardClick = (dept: Department, e: React.MouseEvent<HTMLButtonElement>) => {
        const container = containerRef.current;
        if (!container) return;

        const cr = container.getBoundingClientRect();
        const br = e.currentTarget.getBoundingClientRect();

        setOriginRect({
            top: br.top - cr.top,
            left: br.left - cr.left,
            width: br.width,
            height: br.height,
        });
        setSelected(dept);
        setExpanded(false);
        setContentVisible(false);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setExpanded(true);
                setTimeout(() => setContentVisible(true), 280);
            });
        });
    };

    const handleBack = () => {
        setContentVisible(false);
        setTimeout(() => {
            setExpanded(false);
            setTimeout(() => {
                setSelected(null);
                setOriginRect(null);
            }, 380);
        }, 150);
    };

    return (
        <div ref={containerRef} className="relative min-h-[60vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {depts.map((dept) => (
                    <button
                        key={dept.name}
                        onClick={(e) => handleCardClick(dept, e)}
                        className="text-left rounded-lg border border-border bg-card p-4 hover:border-[#993534]/40 hover:bg-accent/40 transition-colors cursor-pointer"
                    >
                        <p className="text-sm font-semibold leading-tight">{dept.name}</p>
                        {dept.lead && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {dept.lead.rankAbbr} {dept.lead.name}
                            </p>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Expanding overlay ──────────────────────────────────────────── */}
            {selected && originRect && (
                <div
                    className="absolute z-10 bg-card border border-border rounded-lg overflow-y-auto"
                    style={{
                        transition:
                            "top 350ms cubic-bezier(0.4,0,0.2,1), left 350ms cubic-bezier(0.4,0,0.2,1), width 350ms cubic-bezier(0.4,0,0.2,1), height 350ms cubic-bezier(0.4,0,0.2,1)",
                        ...(expanded
                            ? { top: 0, left: 0, width: "100%", height: "100%" }
                            : {
                                  top: originRect.top,
                                  left: originRect.left,
                                  width: originRect.width,
                                  height: originRect.height,
                              }),
                    }}
                >
                    <div
                        className="p-4 sm:p-6 min-h-full transition-opacity duration-200"
                        style={{ opacity: contentVisible ? 1 : 0 }}
                    >
                        {/* Back */}
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 w-fit"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            All Departments
                        </button>

                        {/* Header */}
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#993534] mb-4">
                            {selected.name}
                        </h2>

                        {/* Lead */}
                        {selected.lead && (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                                    Department Lead
                                </p>
                                <p className="text-sm font-semibold mb-4">
                                    {selected.lead.rankAbbr} {selected.lead.name}{" "}
                                    <span className="text-muted-foreground font-normal">
                                        ({selected.lead.numbers})
                                    </span>
                                </p>
                                <Separator className="mb-4" />
                            </>
                        )}

                        {/* Description */}
                        {selected.description ? (
                            <TiptapEditor value={selected.description} editable={false} />
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                No description available.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
