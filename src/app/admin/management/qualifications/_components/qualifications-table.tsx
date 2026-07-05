"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { QualificationForm } from "./qualification-form";
import { deleteQualificationAction } from "../_lib/actions";
import { QUALIFICATION_CATEGORIES } from "../_lib/schema";

type Qualification = {
    id: string;
    name: string;
    abbreviation: string;
    category: typeof QUALIFICATION_CATEGORIES[number];
    rankRequirement: string;
    description: string | null;
};

export function QualificationsTable({ qualifications }: { qualifications: Qualification[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Qualification | null>(null);
    const [deleting, setDeleting] = useState<Qualification | null>(null);

    function handleEdit(qual: Qualification) {
        setEditing(qual);
        setFormOpen(true);
    }

    function handleCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteQualificationAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Qualification deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    {qualifications.length} qualification{qualifications.length !== 1 ? "s" : ""}
                </p>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-1" /> Add Qualification
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-20">Abbrev.</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Min Rank</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {qualifications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No qualifications yet. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            qualifications.map((qual) => (
                                <TableRow key={qual.id}>
                                    <TableCell>
                                        <span className="font-mono text-sm font-semibold">{qual.abbreviation}</span>
                                    </TableCell>
                                    <TableCell className="font-medium">{qual.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{qual.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{qual.rankRequirement}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                        {qual.description ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => handleEdit(qual)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => setDeleting(qual)}
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

            <QualificationForm
                key={editing?.id ?? "new"}
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={
                    editing
                        ? {
                              id: editing.id,
                              name: editing.name,
                              abbreviation: editing.abbreviation,
                              category: editing.category,
                              rankRequirement: editing.rankRequirement,
                              description: editing.description ?? "",
                          }
                        : undefined
                }
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the qualification and revoke it from all troopers who hold it.
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
        </div>
    );
}
