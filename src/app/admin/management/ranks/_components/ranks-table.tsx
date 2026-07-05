"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import { RankForm } from "./rank-form";
import { deleteRankAction } from "../_lib/actions";
import { useRouter } from "next/navigation";

type Rank = {
    id: number;
    name: string | null;
    abbreviation: string | null;
    grade: string | null;
    rankLevel: "Enlisted" | "JNCO" | "SNCO" | "Company" | "Command";
    order: number | null;
    nextRankId: number | null;
};

const RANK_LEVEL_COLORS: Record<string, string> = {
    Enlisted: "secondary",
    JNCO: "outline",
    SNCO: "outline",
    Company: "outline",
    Command: "destructive",
};

export function RanksTable({ ranks }: { ranks: Rank[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Rank | null>(null);
    const [deleting, setDeleting] = useState<Rank | null>(null);

    function handleEdit(rank: Rank) {
        setEditing(rank);
        setFormOpen(true);
    }

    function handleCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteRankAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Rank deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    const rankOptions = ranks.map((r) => ({ id: r.id, name: r.name }));
    const nextRankMap = Object.fromEntries(ranks.map((r) => [r.id, r.name]));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{ranks.length} rank{ranks.length !== 1 ? "s" : ""}</p>
                <Button size="sm" onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-1" /> Add Rank
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">Order</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Abbreviation</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Next Rank</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ranks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    No ranks yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            ranks.map((rank) => (
                                <TableRow key={rank.id}>
                                    <TableCell className="text-muted-foreground">{rank.order ?? "—"}</TableCell>
                                    <TableCell className="font-medium">{rank.name}</TableCell>
                                    <TableCell>{rank.abbreviation ?? "—"}</TableCell>
                                    <TableCell>{rank.grade ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={RANK_LEVEL_COLORS[rank.rankLevel] as "secondary" | "outline" | "destructive"}>
                                            {rank.rankLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {rank.nextRankId ? (nextRankMap[rank.nextRankId] ?? "—") : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(rank)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(rank)}>
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

            <RankForm
                key={editing?.id ?? "new"}
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={editing ? {
                    id: editing.id,
                    name: editing.name ?? "",
                    abbreviation: editing.abbreviation,
                    grade: editing.grade,
                    rankLevel: editing.rankLevel,
                    order: editing.order,
                    nextRankId: editing.nextRankId,
                } : undefined}
                rankOptions={rankOptions}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete rank &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This cannot be undone. Troopers assigned this rank will lose it.
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
