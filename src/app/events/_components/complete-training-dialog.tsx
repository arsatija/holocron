"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { EventRow } from "./event-card";
import { cn } from "@/lib/utils";

interface TrooperOption {
    value: string;
    label: string;
}

interface CompleteTrainingDialogProps {
    event: EventRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCompleted: () => void;
}

export default function CompleteTrainingDialog({
    event,
    open,
    onOpenChange,
    onCompleted,
}: CompleteTrainingDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [troopers, setTroopers] = useState<TrooperOption[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        fetch("/api/v1/troopersList")
            .then((r) => r.json())
            .then((data: TrooperOption[]) => setTroopers(data))
            .catch(() => {});
    }, [open]);

    function toggleTrooper(id: string) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function handleSubmit() {
        startTransition(async () => {
            try {
                const res = await fetch(
                    `/api/v1/events/${event.id}/complete`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ traineeIds: selectedIds }),
                    }
                );

                if (res.ok) {
                    toast.success("Training completed successfully");
                    setSelectedIds([]);
                    onOpenChange(false);
                    onCompleted();
                } else {
                    const err = await res.json();
                    toast.error(err.error || "Failed to complete training");
                }
            } catch {
                toast.error("Failed to complete training");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Complete Training</DialogTitle>
                    <DialogDescription>
                        Select the troopers who attended &quot;{event.name}&quot;. They will
                        be awarded the qualification upon completion.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto border rounded-md">
                    {troopers.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">
                            Loading troopers...
                        </p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {troopers.map((t) => {
                                const selected = selectedIds.includes(t.value);
                                return (
                                    <li
                                        key={t.value}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors text-sm",
                                            selected && "bg-accent"
                                        )}
                                        onClick={() => toggleTrooper(t.value)}
                                    >
                                        <div
                                            className={cn(
                                                "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                                selected
                                                    ? "bg-primary border-primary"
                                                    : "border-muted-foreground"
                                            )}
                                        >
                                            {selected && (
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                            )}
                                        </div>
                                        <span>{t.label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    {selectedIds.length} trooper
                    {selectedIds.length !== 1 ? "s" : ""} selected
                </p>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Complete Training
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
