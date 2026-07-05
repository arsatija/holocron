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
import { PositionForm } from "./position-form";
import { deleteDepartmentPositionAction } from "../_lib/actions";
import { useRouter } from "next/navigation";

type Position = {
    id: string;
    role: string;
    slug: string | null;
    departmentId: string | null;
    departmentName: string | null;
    superiorPositionId: string | null;
    priority: number;
};

type DeptOption = { id: string; name: string };

export function PositionsTable({ positions, departments }: { positions: Position[]; departments: DeptOption[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Position | null>(null);
    const [deleting, setDeleting] = useState<Position | null>(null);

    const filtered = selectedDeptId === "all"
        ? positions
        : positions.filter((p) => p.departmentId === selectedDeptId);

    const positionOptions = positions.map((p) => ({
        id: p.id,
        role: p.role,
        departmentId: p.departmentId ?? "",
    }));

    const positionMap = Object.fromEntries(positions.map((p) => [p.id, p.role]));

    function handleEdit(pos: Position) {
        setEditing(pos);
        setFormOpen(true);
    }

    function handleCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteDepartmentPositionAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Position deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All departments</SelectItem>
                        {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-1" /> Add Position
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Superior</TableHead>
                            <TableHead className="w-12">Priority</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No positions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((pos) => (
                                <TableRow key={pos.id}>
                                    <TableCell className="font-medium">{pos.role}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{pos.slug ?? "—"}</TableCell>
                                    <TableCell>{pos.departmentName ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {pos.superiorPositionId ? (positionMap[pos.superiorPositionId] ?? "—") : "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{pos.priority}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(pos)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(pos)}>
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

            <PositionForm
                key={editing?.id ?? "new"}
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={editing ? {
                    id: editing.id,
                    role: editing.role,
                    slug: editing.slug,
                    departmentId: editing.departmentId ?? "",
                    superiorPositionId: editing.superiorPositionId,
                    priority: editing.priority,
                } : undefined}
                deptOptions={departments}
                positionOptions={positionOptions}
                prefilledDeptId={selectedDeptId !== "all" ? selectedDeptId : undefined}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete position &ldquo;{deleting?.role}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the position and all trooper assignments to it. This cannot be undone.
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
