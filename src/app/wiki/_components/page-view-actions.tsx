"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, EyeOff, History, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    togglePinAction,
    unpublishPageAction,
} from "../_lib/actions";

interface PageViewActionsProps {
    pageId: string;
    collectionSlug: string;
    isPublished: boolean;
    isPinned: boolean;
    // Pinning is admin-forced (visible to everyone), so it's gated separately
    // from the collection-editor permissions the rest of these actions use.
    canManage: boolean;
}

export function PageViewActions({
    pageId,
    collectionSlug,
    isPublished,
    isPinned,
    canManage,
}: PageViewActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [deleteOpen, setDeleteOpen] = useState(false);

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

    function handleTogglePin() {
        startTransition(async () => {
            const result = await togglePinAction(pageId);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isPinned ? "Page unpinned" : "Page pinned for everyone");
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
        <div className="flex gap-2">
            {canManage && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTogglePin}
                    disabled={isPending}
                    className={cn(isPinned && "text-primary")}
                >
                    {isPinned ? (
                        <PinOff className="h-4 w-4 mr-1.5" />
                    ) : (
                        <Pin className="h-4 w-4 mr-1.5" />
                    )}
                    {isPinned ? "Unpin" : "Pin for everyone"}
                </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleTogglePublish} disabled={isPending}>
                {isPublished ? (
                    <EyeOff className="h-4 w-4 mr-1.5" />
                ) : (
                    <Eye className="h-4 w-4 mr-1.5" />
                )}
                {isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button size="sm" variant="outline" asChild>
                <Link href={`/wiki/${collectionSlug}/${pageId}/edit`}>
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
                <Link href={`/wiki/${collectionSlug}/${pageId}/history`}>
                    <History className="h-4 w-4 mr-1.5" />
                    History
                </Link>
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

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
