"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { searchWikiPagesAction } from "../_lib/actions";
import type { WikiSearchResultWithSlug } from "../_lib/queries";

// Rendered inside WikiSidebar, so Ctrl+K is only wired up while a /wiki route
// is mounted — doesn't clobber any app-wide shortcut.
export function WikiSearchDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<WikiSearchResultWithSlug[]>([]);
    const [isPending, startTransition] = useTransition();
    const debouncedQuery = useDebounce(query, 250);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }
        startTransition(async () => {
            const data = await searchWikiPagesAction(debouncedQuery);
            setResults(data);
        });
    }, [debouncedQuery]);

    function handleSelect(result: WikiSearchResultWithSlug) {
        setOpen(false);
        setQuery("");
        router.push(`/wiki/${result.collectionSlug}/${result.id}`);
    }

    function handleViewAll() {
        setOpen(false);
        router.push(`/wiki/search?q=${encodeURIComponent(query)}`);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">Search wiki...</span>
                <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline-block">
                    Ctrl K
                </kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
                    <DialogTitle className="sr-only">Search Wiki</DialogTitle>
                    <Command
                        shouldFilter={false}
                        className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3"
                    >
                        <CommandInput
                            placeholder="Search wiki pages..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {!query.trim() ? (
                                <CommandEmpty>Type to search wiki pages.</CommandEmpty>
                            ) : isPending ? (
                                <CommandEmpty>Searching...</CommandEmpty>
                            ) : results.length === 0 ? (
                                <CommandEmpty>No pages found.</CommandEmpty>
                            ) : (
                                <CommandGroup heading="Pages">
                                    {results.map((result) => (
                                        <CommandItem
                                            key={result.id}
                                            value={result.id}
                                            onSelect={() => handleSelect(result)}
                                            className="flex-col items-start gap-0.5"
                                        >
                                            <span className="font-medium">{result.title}</span>
                                            <span
                                                className="text-xs text-muted-foreground line-clamp-1 [&_b]:text-foreground [&_b]:font-semibold"
                                                dangerouslySetInnerHTML={{ __html: result.snippet }}
                                            />
                                        </CommandItem>
                                    ))}
                                    <CommandItem
                                        value="__view-all"
                                        onSelect={handleViewAll}
                                        className="text-primary"
                                    >
                                        View all results for &ldquo;{query}&rdquo;
                                    </CommandItem>
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    );
}
