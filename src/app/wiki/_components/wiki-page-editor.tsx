"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, MoreHorizontal, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WikiEditor } from "@/components/tiptap/wiki-editor";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    deletePageAction,
    publishPageAction,
    unpublishPageAction,
    updatePageAction,
} from "../_lib/actions";

interface WikiPageEditorProps {
    pageId: string;
    collectionSlug: string;
    initialTitle: string;
    initialContent: string;
    isPublished: boolean;
}

export function WikiPageEditor({
    pageId,
    collectionSlug,
    initialTitle,
    initialContent,
    isPublished,
}: WikiPageEditorProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [dirty, setDirty] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [deleteOpen, setDeleteOpen] = useState(false);

    function handleSave(navigateAfter = false) {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        startTransition(async () => {
            const result = await updatePageAction(pageId, { title: title.trim(), content });
            if (result && "error" in result) {
                toast.error(result.error);
                return;
            }
            setDirty(false);
            toast.success("Page saved");
            if (navigateAfter) {
                router.push(`/wiki/${collectionSlug}/${pageId}`);
            }
            router.refresh();
        });
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                handleSave(false);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, content]);

    function handleTogglePublish() {
        startTransition(async () => {
            const result = isPublished
                ? await unpublishPageAction(pageId)
                : await publishPageAction(pageId);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isPublished ? "Page unpublished" : "Page published");
                router.refresh();
            }
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

    return (
        <div className="space-y-4 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/wiki/${collectionSlug}/${pageId}`}>
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Back
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Page options">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={handleTogglePublish}>
                                {isPublished ? (
                                    <EyeOff className="h-3.5 w-3.5 mr-2" />
                                ) : (
                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                )}
                                {isPublished ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => setDeleteOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" onClick={() => handleSave(true)} disabled={isPending}>
                        <Save className="h-4 w-4 mr-1.5" />
                        {isPending ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            <Input
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                }}
                placeholder="Page title"
                className="text-2xl font-bold h-auto py-2 px-3"
            />

            <WikiEditor
                value={content}
                onChange={(html) => {
                    setContent(html);
                    setDirty(true);
                }}
                editable
            />

            {dirty && (
                <p className="text-xs text-muted-foreground">
                    Unsaved changes — Ctrl+S to save.
                </p>
            )}

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
