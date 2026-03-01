"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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

export default function DepartmentsGrid({ depts }: { depts: Department[] }) {
    const [selected, setSelected] = useState<Department | null>(null);

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {depts.map((dept) => (
                    <button
                        key={dept.name}
                        onClick={() => setSelected(dept)}
                        className="text-left rounded-lg border border-border bg-card p-4 hover:border-[#993534]/40 hover:bg-accent/40 transition-colors cursor-pointer"
                    >
                        <p className="text-sm font-semibold leading-tight">{dept.name}</p>
                    </button>
                ))}
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selected?.name}</DialogTitle>
                    </DialogHeader>

                    {selected?.description ? (
                        <TiptapEditor value={selected.description} editable={false} />
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            No description available.
                        </p>
                    )}

                    {selected?.lead && (
                        <div className="pt-3 border-t border-border">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                                Department Lead
                            </p>
                            <p className="text-sm font-semibold">
                                {selected.lead.rankAbbr} {selected.lead.name}{" "}
                                <span className="text-muted-foreground font-normal">
                                    ({selected.lead.numbers})
                                </span>
                            </p>
                            <p className="text-xs text-muted-foreground">{selected.lead.role}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
