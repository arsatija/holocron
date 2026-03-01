"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

const TiptapEditor = dynamic(() => import("@/components/tiptap/editor"), {
    ssr: false,
});

type Qual = {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
    rankRequirement: string;
    description: string | null | undefined;
};

interface CardRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const CATEGORY_ORDER = [
    "Standard",
    "Advanced",
    "Medical",
    "Aviation",
    "Detachments",
    "Leadership",
] as const;

export default function QualificationsGrid({ quals }: { quals: Qual[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<Qual | null>(null);
    const [originRect, setOriginRect] = useState<CardRect | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);

    const byCategory = new Map<string, Qual[]>();
    for (const q of quals) {
        if (!byCategory.has(q.category)) byCategory.set(q.category, []);
        byCategory.get(q.category)!.push(q);
    }

    const categories = CATEGORY_ORDER.filter(
        (cat) => (byCategory.get(cat)?.length ?? 0) > 0
    );

    const handleCardClick = (qual: Qual, e: React.MouseEvent<HTMLButtonElement>) => {
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
        setSelected(qual);
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
            <Tabs defaultValue={categories[0]}>
                <TabsList className="flex-wrap h-auto mb-6">
                    {categories.map((cat) => (
                        <TabsTrigger key={cat} value={cat}>
                            {cat}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map((cat) => (
                    <TabsContent key={cat} value={cat}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {byCategory.get(cat)!.map((q) => (
                                <button
                                    key={q.id}
                                    onClick={(e) => handleCardClick(q, e)}
                                    className="text-left rounded-lg border border-border bg-card p-4 hover:border-[#993534]/40 hover:bg-accent/40 transition-colors cursor-pointer"
                                >
                                    <p className="text-sm font-semibold leading-tight">
                                        {q.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Available at {q.rankRequirement}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

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
                            All Qualifications
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#993534]">
                                {selected.name}
                            </h2>
                            <Badge
                                variant="secondary"
                                className="font-mono text-xs border border-[#993534]/30 bg-[#993534]/10 text-foreground shrink-0"
                            >
                                {selected.abbreviation}
                            </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4">
                            {selected.category} · Available at {selected.rankRequirement}
                        </p>

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
