"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const TiptapEditor = dynamic(() => import("@/components/tiptap/editor"), {
    ssr: false,
});

type Qual = {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
    description: string | null | undefined;
};

const CATEGORY_ORDER = [
    "Standard",
    "Medical",
    "Advanced",
    "Aviation",
    "Detachments",
    "Leadership",
] as const;

export default function QualificationsGrid({ quals }: { quals: Qual[] }) {
    const [selected, setSelected] = useState<Qual | null>(null);

    const byCategory = new Map<string, Qual[]>();
    for (const q of quals) {
        if (!byCategory.has(q.category)) byCategory.set(q.category, []);
        byCategory.get(q.category)!.push(q);
    }

    const categories = CATEGORY_ORDER.filter(
        (cat) => (byCategory.get(cat)?.length ?? 0) > 0
    );

    return (
        <>
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
                                    onClick={() => setSelected(q)}
                                    className="text-left rounded-lg border border-border bg-card p-4 hover:border-[#993534]/40 hover:bg-accent/40 transition-colors cursor-pointer"
                                >
                                    <p className="text-sm font-semibold leading-tight">
                                        {q.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Available at CT
                                    </p>
                                </button>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between gap-3 pr-2">
                            <span>{selected?.name}</span>
                            <Badge
                                variant="secondary"
                                className="font-mono text-xs border border-[#993534]/30 bg-[#993534]/10 text-foreground shrink-0"
                            >
                                {selected?.abbreviation}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>
                    {selected?.description ? (
                        <TiptapEditor value={selected.description} editable={false} />
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            No description available.
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
