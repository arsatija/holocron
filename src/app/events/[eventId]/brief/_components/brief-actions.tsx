"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
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
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

interface BriefActionsProps {
    eventId: string;
}

export default function BriefActions({ eventId }: BriefActionsProps) {
    const router = useRouter();
    const { trooperCtx } = useController();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canManage = checkPermissionsSync(trooperCtx, [
        "Zeus",
        "Admin",
        RankLevel.Command,
    ]);

    if (!canManage) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/v1/events/${eventId}/brief`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error ?? "Failed to delete brief");
                return;
            }
            toast.success("Brief deleted");
            router.push(`/events/${eventId}`);
        } catch {
            toast.error("Failed to delete brief");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={() => router.push(`/events/${eventId}/edit`)}
                >
                    <Settings className="h-4 w-4 mr-1.5" />
                    Edit Event
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={() => router.push(`/events/${eventId}/brief/edit`)}
                >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit Brief
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-red-900/60 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-700"
                    onClick={() => setDeleteOpen(true)}
                >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete Brief
                </Button>
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Operation Brief</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            This will permanently delete the brief. The event will remain and can have a new brief filed later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-700 hover:bg-red-600 text-white border-0"
                        >
                            {isDeleting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
                            ) : "Delete Brief"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
