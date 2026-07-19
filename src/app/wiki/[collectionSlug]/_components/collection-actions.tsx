"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
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
import { CollectionFormDialog } from "@/app/wiki/_components/collection-form-dialog";
import { deleteCollectionAction } from "@/app/wiki/_lib/actions";
import type { PermissionOption } from "@/app/wiki/_lib/queries";
import type { WikiCollection } from "@/db/schema";

interface CollectionActionsProps {
    collection: WikiCollection;
    permissionOptions: PermissionOption[];
}

export function CollectionActions({
    collection,
    permissionOptions,
}: CollectionActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteCollectionAction(collection.id);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Collection deleted");
                router.push("/wiki");
                router.refresh();
            }
            setDeleteOpen(false);
        });
    }

    return (
        <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <CollectionFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                defaultValues={{
                    id: collection.id,
                    name: collection.name,
                    description: collection.description ?? "",
                    icon: collection.icon ?? "",
                    readPermissions: collection.readPermissions,
                    editPermissions: collection.editPermissions,
                }}
                permissionOptions={permissionOptions}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete collection &ldquo;{collection.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This deletes every page, revision, star, and link in this
                            collection. This cannot be undone.
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
