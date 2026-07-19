"use client";

import { useRef, useState } from "react";
import { ChevronLeft, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WikiEditor } from "@/components/tiptap/wiki-editor";
import type { TocHeading } from "../_lib/toc";

interface WikiPageWithTocProps {
    content: string;
    headings: TocHeading[];
    children?: React.ReactNode;
}

export function WikiPageWithToc({ content, headings, children }: WikiPageWithTocProps) {
    const [tocOpen, setTocOpen] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    function scrollToHeading(text: string) {
        const container = contentRef.current;
        if (!container) return;
        const els = container.querySelectorAll("h1, h2, h3, h4");
        for (const el of els) {
            if (el.textContent?.trim() === text) {
                container.scrollTo({
                    top: container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - 16,
                    behavior: "smooth",
                });
                return;
            }
        }
    }

    return (
        <div className="h-full flex gap-6">
            {/* TOC column — never scrolls with content */}
            <div className={cn("shrink-0 h-full overflow-y-auto transition-[width] duration-200", tocOpen ? "w-52" : "w-8")}>
                {tocOpen ? (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                On this page
                            </p>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 shrink-0"
                                onClick={() => setTocOpen(false)}
                                title="Close table of contents"
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>
                        </div>
                        {headings.length > 0 ? (
                            <nav className="space-y-0.5 border-l border-border pl-3">
                                {headings.map((h, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => scrollToHeading(h.text)}
                                        className={cn(
                                            "block w-full text-left py-1 text-sm text-muted-foreground hover:text-foreground transition-colors truncate leading-snug",
                                            h.level === 1 && "font-medium text-foreground/80",
                                            h.level === 2 && "pl-2",
                                            h.level === 3 && "pl-4",
                                            h.level === 4 && "pl-6 text-xs",
                                        )}
                                    >
                                        {h.text}
                                    </button>
                                ))}
                            </nav>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No headings</p>
                        )}
                    </div>
                ) : (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setTocOpen(true)}
                        title="Open table of contents"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Content column — the only thing that scrolls */}
            <div ref={contentRef} className="flex-1 min-w-0 h-full overflow-y-auto">
                <WikiEditor value={content} editable={false} />
                {children}
            </div>
        </div>
    );
}
