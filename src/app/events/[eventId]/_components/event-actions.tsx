"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
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

type EventKind = "Operation" | "Training" | "Meeting" | "Social";

const KIND_PERMISSIONS: Record<EventKind, string[]> = {
    Operation: ["Zeus", "Admin", RankLevel.Command],
    Training: ["Training", "Admin", RankLevel.Command],
    Meeting: ["Admin", RankLevel.Company, RankLevel.Command],
    Social: ["Admin", RankLevel.JNCO, RankLevel.SNCO, RankLevel.Company, RankLevel.Command],
};

interface EventActionsProps {
    eventId: string;
    eventKind: EventKind;
}

export default function EventActions({ eventId, eventKind }: EventActionsProps) {
    const router = useRouter();
    const { trooperCtx } = useController();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canEdit = checkPermissionsSync(trooperCtx, KIND_PERMISSIONS[eventKind]);

    if (!canEdit) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/v1/events/${eventId}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error ?? "Failed to delete event");
                return;
            }
            toast.success("Event deleted");
            router.push("/events");
        } catch {
            toast.error("Failed to delete event");
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
                    onClick={() => router.push(`/events/${eventId}/edit`)}
                >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit Event
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive border-destructive/40 hover:border-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteOpen(true)}
                >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                </Button>
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The event and all associated data will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
                            ) : "Delete Event"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
