"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CollectionFormDialog } from "@/app/wiki/_components/collection-form-dialog";
import { PageFormDialog } from "@/app/wiki/_components/page-form-dialog";
import { createPageAction, deleteCollectionAction } from "@/app/wiki/_lib/actions";
import type { PermissionOption } from "@/app/wiki/_lib/queries";
import type { WikiCollection } from "@/db/schema";

interface CollectionActionsProps {
    collection: WikiCollection;
    permissionOptions: PermissionOption[];
    canEdit: boolean;
    canManage: boolean;
}

export function CollectionActions({
    collection,
    permissionOptions,
    canEdit,
    canManage,
}: CollectionActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [newPageOpen, setNewPageOpen] = useState(false);

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

    async function handleCreatePage(title: string) {
        const result = await createPageAction({
            collectionId: collection.id,
            parentPageId: null,
            title,
        });
        if (result && "error" in result) {
            toast.error(result.error);
            return;
        }
        setNewPageOpen(false);
        router.refresh();
        if (result && "id" in result) {
            router.push(`/wiki/${collection.slug}/${result.id}/edit`);
        }
    }

    return (
        <>
            <div className="flex items-center gap-2">
                {canEdit && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5"
                        onClick={() => setNewPageOpen(true)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New Page
                    </Button>
                )}
                {canManage && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Collection options">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => setDeleteOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete collection
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <PageFormDialog
                open={newPageOpen}
                onOpenChange={setNewPageOpen}
                onSubmit={handleCreatePage}
            />

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
        </>
    );
}
