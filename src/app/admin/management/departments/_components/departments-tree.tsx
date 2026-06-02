"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { DepartmentForm } from "./department-form";
import { deleteDepartmentAction } from "../_lib/actions";
import { useRouter } from "next/navigation";

type Department = TreeItem & {
    description: string | null;
    icon: string;
    departmentScopes: string[];
};

export function DepartmentsTree({ departments }: { departments: Department[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Department | null>(null);
    const [prefilledParentId, setPrefilledParentId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<Department | null>(null);

    const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }));

    function handleEdit(item: Department) {
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

    function handleDelete(item: Department) {
        setDeleting(item);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteDepartmentAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Department deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    const formDefaults = editing
        ? {
              id: editing.id,
              name: editing.name,
              description: editing.description,
              icon: editing.icon,
              parentId: editing.parentId,
              priority: editing.priority,
              departmentScopes: editing.departmentScopes as ("Admin" | "Recruitment" | "Training" | "Attendance" | "Roster" | "Qualifications" | "Mod" | "SGD")[],
          }
        : prefilledParentId
          ? { parentId: prefilledParentId, name: "", description: null, icon: "/images/9_logo.png", priority: -1, departmentScopes: [] as ("Admin" | "Recruitment" | "Training" | "Attendance" | "Roster" | "Qualifications" | "Mod" | "SGD")[] }
          : undefined;

    return (
        <>
            <EntityTree
                items={departments}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
                onAddRoot={handleAddRoot}
                addLabel="Add Department"
                renderMeta={(item) =>
                    item.departmentScopes.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                            {item.departmentScopes.slice(0, 3).map((scope) => (
                                <Badge key={scope} variant="secondary" className="text-xs px-1.5 py-0">
                                    {scope}
                                </Badge>
                            ))}
                            {item.departmentScopes.length > 3 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    +{item.departmentScopes.length - 3}
                                </Badge>
                            )}
                        </div>
                    ) : null
                }
            />

            <DepartmentForm
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={formDefaults}
                deptOptions={deptOptions}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will also delete all positions within this department. This cannot be undone.
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
