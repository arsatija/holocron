"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, EyeOff, MoreHorizontal, RotateCcw, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WikiEditor } from "@/components/tiptap/wiki-editor";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    autoSavePageAction,
    deletePageAction,
    publishPageAction,
    revertDraftAction,
    unpublishPageAction,
} from "../_lib/actions";

const AUTO_SAVE_INTERVAL_MS = 30_000;

interface WikiPageEditorProps {
    pageId: string;
    collectionSlug: string;
    initialTitle: string;
    initialContent: string;
    publishedTitle: string;
    publishedContent: string;
    isPublished: boolean;
    hasDraft: boolean;
    draftSavedAt: string | null;
}

function useRelativeTime(date: Date | null): string | null {
    const [, tick] = useState(0);

    useEffect(() => {
        if (!date) return;
        const id = setInterval(() => tick((n) => n + 1), 5_000);
        return () => clearInterval(id);
    }, [date]);

    if (!date) return null;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? "1 min ago" : `${minutes} min ago`;
}

export function WikiPageEditor({
    pageId,
    collectionSlug,
    initialTitle,
    initialContent,
    publishedTitle,
    publishedContent,
    isPublished,
    hasDraft,
    draftSavedAt,
}: WikiPageEditorProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [isPending, startTransition] = useTransition();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [revertOpen, setRevertOpen] = useState(false);

    // What was last persisted to the draft columns (either from server or after auto-save)
    const lastSaved = useRef<{ title: string; content: string }>({
        title: initialTitle,
        content: initialContent,
    });
    // Timestamp of the most recent auto-save (null = no auto-save yet this session)
    const [savedAt, setSavedAt] = useState<Date | null>(
        draftSavedAt ? new Date(draftSavedAt) : null
    );
    // True when editor content differs from lastSaved (drives "Unsaved changes" text)
    const [unsaved, setUnsaved] = useState(false);

    const relativeTime = useRelativeTime(savedAt);

    function markDirty() {
        setUnsaved(true);
    }

    const runAutoSave = useCallback(async (currentTitle: string, currentContent: string) => {
        if (
            currentTitle === lastSaved.current.title &&
            currentContent === lastSaved.current.content
        ) {
            setUnsaved(false);
            return;
        }
        const result = await autoSavePageAction(pageId, {
            title: currentTitle,
            content: currentContent,
        });
        if (result && "error" in result) return;
        lastSaved.current = { title: currentTitle, content: currentContent };
        setSavedAt(new Date());
        setUnsaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageId]);

    // Capture latest values in a ref so the interval closure never goes stale
    const editorState = useRef({ title, content });
    useEffect(() => {
        editorState.current = { title, content };
    }, [title, content]);

    // 30-second auto-save interval
    useEffect(() => {
        const id = setInterval(() => {
            const { title: t, content: c } = editorState.current;
            runAutoSave(t, c);
        }, AUTO_SAVE_INTERVAL_MS);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ctrl/Cmd+S → immediate auto-save
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                const { title: t, content: c } = editorState.current;
                runAutoSave(t, c);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save on browser-level unload (tab close, reload, address-bar navigation).
    // fetch with keepalive continues after the page begins unloading.
    useEffect(() => {
        function onBeforeUnload() {
            const { title: t, content: c } = editorState.current;
            if (t === lastSaved.current.title && c === lastSaved.current.content) return;
            fetch("/api/v1/wiki/autosave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageId, title: t, content: c }),
                keepalive: true,
            });
        }
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [pageId]);

    function handlePublish() {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        startTransition(async () => {
            const result = await publishPageAction(pageId, {
                title: title.trim(),
                content,
            });
            if (result && "error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success("Page published");
            router.push(`/wiki/${collectionSlug}/${pageId}`);
            router.refresh();
        });
    }

    function handleUnpublish() {
        startTransition(async () => {
            const result = await unpublishPageAction(pageId);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Page unpublished");
                router.refresh();
            }
        });
    }

    function handleRevert() {
        startTransition(async () => {
            const result = await revertDraftAction(pageId);
            if (!result || "error" in result) {
                toast.error((result as { error: string })?.error ?? "Failed to revert");
                return;
            }
            setTitle(result.title);
            setContent(result.content);
            lastSaved.current = { title: result.title, content: result.content };
            setSavedAt(null);
            setUnsaved(false);
            setRevertOpen(false);
            toast.success("Draft reverted to last published version");
        });
    }

    function handleDelete() {
        startTransition(async () => {
            const result = await deletePageAction(pageId);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Page deleted");
                router.push(`/wiki/${collectionSlug}`);
                router.refresh();
            }
            setDeleteOpen(false);
        });
    }

    const hasRevertableChanges = hasDraft || savedAt !== null;

    // Status line below the editor
    let statusText: string | null = null;
    if (unsaved) {
        statusText = "Unsaved changes";
    } else if (savedAt && relativeTime) {
        statusText = `Autosaved ${relativeTime}`;
    } else if (hasDraft && !savedAt) {
        statusText = "Draft in progress";
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        const { title: t, content: c } = editorState.current;
                        await runAutoSave(t, c);
                        router.push(`/wiki/${collectionSlug}/${pageId}`);
                    }}
                >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Back
                </Button>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Page options">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {hasRevertableChanges && (
                                <>
                                    <DropdownMenuItem
                                        onSelect={() => setRevertOpen(true)}
                                        className="text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                        Revert to published
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            {isPublished && (
                                <DropdownMenuItem onSelect={handleUnpublish}>
                                    <EyeOff className="h-3.5 w-3.5 mr-2" />
                                    Unpublish
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onSelect={() => setDeleteOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button size="sm" onClick={handlePublish} disabled={isPending}>
                        <Send className="h-4 w-4 mr-1.5" />
                        {isPending ? "Publishing..." : "Publish"}
                    </Button>
                </div>
            </div>

            <Input
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    markDirty();
                }}
                placeholder="Page title"
                className="text-2xl font-bold h-auto py-2 px-3"
            />

            <WikiEditor
                value={content}
                onChange={(html) => {
                    setContent(html);
                    markDirty();
                }}
                editable
            />

            {/* Status line */}
            {statusText && (
                <p className="text-xs text-muted-foreground">{statusText}</p>
            )}

            {/* Revert confirmation */}
            <AlertDialog open={revertOpen} onOpenChange={setRevertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revert to published version?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will discard your draft and restore the page to the last
                            published version. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-amber-600 text-white hover:bg-amber-700"
                            onClick={handleRevert}
                            disabled={isPending}
                        >
                            Revert
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete confirmation */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this page?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This deletes the page, its subpages, and all revisions.
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
