"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";

export interface SuggestionItem {
    id: string;
    label: string;
    collectionSlug?: string;
}

interface SuggestionListProps {
    items: SuggestionItem[];
    command: (item: SuggestionItem) => void;
    loading?: boolean;
    emptyLabel?: string;
}

export interface SuggestionListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SuggestionList = forwardRef<SuggestionListRef, SuggestionListProps>(
    ({ items, command, loading, emptyLabel = "No results" }, ref) => {
        const [selected, setSelected] = useState(0);

        useEffect(() => setSelected(0), [items]);

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }) => {
                if (items.length === 0) return false;
                if (event.key === "ArrowDown") {
                    setSelected((prev) => (prev + 1) % items.length);
                    return true;
                }
                if (event.key === "ArrowUp") {
                    setSelected((prev) => (prev - 1 + items.length) % items.length);
                    return true;
                }
                if (event.key === "Enter") {
                    command(items[selected]);
                    return true;
                }
                return false;
            },
        }));

        return (
            <div className="w-64 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                {loading ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">Searching...</p>
                ) : items.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">{emptyLabel}</p>
                ) : (
                    items.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            className={cn(
                                "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm truncate",
                                index === selected
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                            onMouseEnter={() => setSelected(index)}
                            onClick={() => command(item)}
                        >
                            {item.label}
                        </button>
                    ))
                )}
            </div>
        );
    }
);

SuggestionList.displayName = "SuggestionList";
