"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Pencil, Trash2, Plus, ListChecks } from "lucide-react";
import { MedalForm } from "./medal-form";
import { MedalCriteriaDialog } from "./medal-criteria-dialog";
import { deleteMedalAction } from "../_lib/actions";
import { useRouter } from "next/navigation";

type Medal = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string;
    autoAwardEnabled: boolean;
};

export function MedalsTable({ medals }: { medals: Medal[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Medal | null>(null);
    const [deleting, setDeleting] = useState<Medal | null>(null);
    const [managingCriteria, setManagingCriteria] = useState<Medal | null>(null);

    function handleEdit(medal: Medal) {
        setEditing(medal);
        setFormOpen(true);
    }

    function handleCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteMedalAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Medal deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    {medals.length} medal{medals.length !== 1 ? "s" : ""}
                </p>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-1" /> Add Medal
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-14">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {medals.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center text-muted-foreground py-8"
                                >
                                    No medals yet. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            medals.map((medal) => (
                                <TableRow key={medal.id}>
                                    <TableCell>
                                        <div className="relative h-10 w-10">
                                            <Image
                                                src={medal.imageUrl}
                                                alt={medal.name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {medal.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                        {medal.description ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => setManagingCriteria(medal)}
                                            >
                                                <ListChecks className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => handleEdit(medal)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => setDeleting(medal)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <MedalForm
                key={editing?.id ?? "new"}
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={
                    editing
                        ? {
                              id: editing.id,
                              name: editing.name,
                              description: editing.description ?? "",
                              imageUrl: editing.imageUrl,
                              autoAwardEnabled: editing.autoAwardEnabled,
                          }
                        : undefined
                }
                onSuccess={() => router.refresh()}
            />

            <AlertDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete &ldquo;{deleting?.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the medal and revoke it from all troopers who hold it.
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

            {managingCriteria && (
                <MedalCriteriaDialog
                    medal={managingCriteria}
                    open={!!managingCriteria}
                    onOpenChange={(open) => !open && setManagingCriteria(null)}
                />
            )}
        </div>
    );
}
