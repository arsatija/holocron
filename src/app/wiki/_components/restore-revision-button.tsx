"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { restoreRevisionAction } from "../_lib/actions";

interface RestoreRevisionButtonProps {
    pageId: string;
    revisionId: string;
    collectionSlug: string;
}

export function RestoreRevisionButton({
    pageId,
    revisionId,
    collectionSlug,
}: RestoreRevisionButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    function handleRestore() {
        startTransition(async () => {
            const result = await restoreRevisionAction(pageId, revisionId);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Revision restored");
                router.push(`/wiki/${collectionSlug}/${pageId}`);
                router.refresh();
            }
            setOpen(false);
        });
    }

    return (
        <>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <History className="h-4 w-4 mr-1.5" />
                Restore this revision
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore this revision?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The page&apos;s current content will be saved as a new
                            revision before this one is applied, so nothing is lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} disabled={isPending}>
                            Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
