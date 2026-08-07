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
import { Trash2, Plus } from "lucide-react";
import { MedicAttendanceForm } from "./medic-attendance-form";
import { deleteMedicAttendanceAction } from "../_lib/actions";

type MedicAttendanceRecord = {
    id: string;
    operationType: string;
    medic: { id: string; name: string; numbers: number } | null;
    element: { id: string; name: string } | null;
    event: { id: string; name: string; eventDate: string } | null;
    submitter: { id: string; name: string } | null;
};

export function MedicAttendanceTable({
    records,
}: {
    records: MedicAttendanceRecord[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState<MedicAttendanceRecord | null>(null);

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteMedicAttendanceAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Record deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    {records.length} record{records.length !== 1 ? "s" : ""}
                </p>
                <Button size="sm" onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Log Medic Attendance
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Medic</TableHead>
                            <TableHead>Element</TableHead>
                            <TableHead>Operation Type</TableHead>
                            <TableHead>Linked Operation</TableHead>
                            <TableHead>Submitted By</TableHead>
                            <TableHead className="w-14" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center text-muted-foreground py-8"
                                >
                                    No medic attendance logged yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">
                                        {record.medic?.name ?? "Unknown"}
                                    </TableCell>
                                    <TableCell>{record.element?.name ?? "—"}</TableCell>
                                    <TableCell>{record.operationType}</TableCell>
                                    <TableCell>
                                        {record.event
                                            ? `${record.event.name} — ${record.event.eventDate}`
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {record.submitter?.name ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => setDeleting(record)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <MedicAttendanceForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this medic attendance record.
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