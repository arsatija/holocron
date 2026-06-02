"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { EntityTree, TreeItem } from "../../_components/entity-tree";
import { UnitElementForm } from "./unit-element-form";
import { deleteUnitElementAction } from "../_lib/actions";
import { useRouter } from "next/navigation";

type UnitElement = TreeItem & {
    radio: string | null;
    icon: string;
};

export function UnitElementsTree({ elements }: { elements: UnitElement[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<UnitElement | null>(null);
    const [prefilledParentId, setPrefilledParentId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<UnitElement | null>(null);

    const elementOptions = elements.map((e) => ({ id: e.id, name: e.name }));

    function handleEdit(item: UnitElement) {
        setEditing(item);
        setPrefilledParentId(null);
        setFormOpen(true);
    }

    function handleAddRoot() {
        setEditing(null);
        setPrefilledParentId(null);
        setFormOpen(true);
    }

    function handleAddChild(parentId: string) {
        setEditing(null);
        setPrefilledParentId(parentId);
        setFormOpen(true);
    }

    function handleDelete(item: UnitElement) {
        setDeleting(item);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteUnitElementAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Unit element deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    const formDefaults = editing
        ? {
              id: editing.id,
              name: editing.name,
              icon: editing.icon,
              parentId: editing.parentId,
              priority: editing.priority,
              radio: editing.radio,
          }
        : prefilledParentId
          ? { parentId: prefilledParentId, name: "", icon: "/images/9_logo.png", priority: -1, radio: null }
          : undefined;

    return (
        <>
            <EntityTree
                items={elements}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
                onAddRoot={handleAddRoot}
                addLabel="Add Unit Element"
                renderMeta={(item) =>
                    item.radio ? (
                        <span className="text-xs text-muted-foreground font-mono">{item.radio}</span>
                    ) : null
                }
            />

            <UnitElementForm
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={formDefaults}
                elementOptions={elementOptions}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will also delete all billets under this unit element. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteConfirm}
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
