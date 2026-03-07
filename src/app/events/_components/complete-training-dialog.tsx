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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EventRow } from "./event-card";
import {
    MultiSelector,
    MultiSelectorTrigger,
    MultiSelectorInput,
    MultiSelectorContent,
    MultiSelectorList,
    MultiSelectorItem,
} from "@/components/ui/multi-select2";

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

    function handleSubmit() {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/v1/events/${event.id}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ traineeIds: selectedIds }),
                });

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
            <DialogContent className="sm:max-w-[480px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Complete Training</DialogTitle>
                    <DialogDescription>
                        Select the troopers who attended &quot;{event.name}&quot;. They will
                        be awarded the qualification upon completion.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-1">
                    <p className="text-sm font-medium">Attendees</p>
                    <MultiSelector
                        values={selectedIds}
                        onValuesChange={setSelectedIds}
                        options={troopers}
                    >
                        <MultiSelectorTrigger>
                            <MultiSelectorInput placeholder="Search troopers..." />
                        </MultiSelectorTrigger>
                        <MultiSelectorContent>
                            <MultiSelectorList>
                                {troopers.map((t) => (
                                    <MultiSelectorItem key={t.value} value={t.value}>
                                        {t.label}
                                    </MultiSelectorItem>
                                ))}
                            </MultiSelectorList>
                        </MultiSelectorContent>
                    </MultiSelector>
                    <p className="text-xs text-muted-foreground">
                        {selectedIds.length} trooper{selectedIds.length !== 1 ? "s" : ""} selected
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete Training
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
