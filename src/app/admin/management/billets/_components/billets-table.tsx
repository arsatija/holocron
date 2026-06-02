"use client";

import { useState, useTransition } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import { BilletForm } from "./billet-form";
import { deleteBilletAction } from "../_lib/actions";
import { useRouter } from "next/navigation";

type Billet = {
    id: string;
    role: string;
    slug: string | null;
    unitElementId: string | null;
    unitElementName: string | null;
    superiorBilletId: string | null;
    priority: number;
};

type UnitElementOption = { id: string; name: string };

export function BilletsTable({ billets, unitElements }: { billets: Billet[]; unitElements: UnitElementOption[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Billet | null>(null);
    const [deleting, setDeleting] = useState<Billet | null>(null);

    const filtered = selectedUnitId === "all"
        ? billets
        : billets.filter((b) => b.unitElementId === selectedUnitId);

    const billetOptions = billets.map((b) => ({
        id: b.id,
        role: b.role,
        unitElementId: b.unitElementId,
    }));

    const billetMap = Object.fromEntries(billets.map((b) => [b.id, b.role]));

    function handleEdit(billet: Billet) {
        setEditing(billet);
        setFormOpen(true);
    }

    function handleCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteBilletAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Billet deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="All unit elements" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All unit elements</SelectItem>
                        {unitElements.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-1" /> Add Billet
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Unit Element</TableHead>
                            <TableHead>Superior</TableHead>
                            <TableHead className="w-12">Priority</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No billets found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((billet) => (
                                <TableRow key={billet.id}>
                                    <TableCell className="font-medium">{billet.role}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{billet.slug ?? "—"}</TableCell>
                                    <TableCell>{billet.unitElementName ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {billet.superiorBilletId ? (billetMap[billet.superiorBilletId] ?? "—") : "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{billet.priority}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(billet)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(billet)}>
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

            <BilletForm
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={editing ? {
                    id: editing.id,
                    role: editing.role,
                    slug: editing.slug,
                    unitElementId: editing.unitElementId ?? "",
                    superiorBilletId: editing.superiorBilletId,
                    priority: editing.priority,
                } : undefined}
                unitElementOptions={unitElements}
                billetOptions={billetOptions}
                prefilledUnitElementId={selectedUnitId !== "all" ? selectedUnitId : undefined}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete billet &ldquo;{deleting?.role}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the billet and any trooper assigned to it. This cannot be undone.
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
