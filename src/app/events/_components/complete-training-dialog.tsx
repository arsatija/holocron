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
import { Loader2, Link2 } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

interface TrooperOption {
    value: string;
    label: string;
}

interface UnlinkedCompletion {
    id: string;
    trainingDate: string;
    trainingNotes: string | null;
    qualificationId: string | null;
    qualificationName: string | null;
    qualificationAbbreviation: string | null;
    trainerName: string | null;
    trainerNumbers: number | null;
    traineeCount: string[];
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
    const [mode, setMode] = useState<"new" | "link">("new");

    // New completion state
    const [troopers, setTroopers] = useState<TrooperOption[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Link existing state
    const [unlinkedCompletions, setUnlinkedCompletions] = useState<UnlinkedCompletion[]>([]);
    const [selectedCompletionId, setSelectedCompletionId] = useState<string>("");
    const [completionsLoading, setCompletionsLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setMode("new");
        setSelectedIds([]);
        setSelectedCompletionId("");

        fetch("/api/v1/troopersList")
            .then((r) => r.json())
            .then((data: TrooperOption[]) => setTroopers(data))
            .catch(() => {});

        if (event.qualificationId) {
            setCompletionsLoading(true);
            fetch(`/api/v1/training-completions/unlinked?qualificationId=${event.qualificationId}`)
                .then((r) => r.json())
                .then((data: UnlinkedCompletion[]) => setUnlinkedCompletions(data))
                .catch(() => {})
                .finally(() => setCompletionsLoading(false));
        }
    }, [open, event.qualificationId]);

    function handleSubmit() {
        startTransition(async () => {
            try {
                const body = mode === "link"
                    ? { existingCompletionId: selectedCompletionId }
                    : { traineeIds: selectedIds };

                const res = await fetch(`/api/v1/events/${event.id}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                if (res.ok) {
                    toast.success(mode === "link" ? "Training linked successfully" : "Training completed successfully");
                    setSelectedIds([]);
                    setSelectedCompletionId("");
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

    const canSubmit = mode === "new" ? true : !!selectedCompletionId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Complete Training</DialogTitle>
                    <DialogDescription>
                        {mode === "new"
                            ? `Select the troopers who attended "${event.name}". They will be awarded the qualification upon completion.`
                            : `Link an existing training completion record to "${event.name}".`}
                    </DialogDescription>
                </DialogHeader>

                {/* Mode toggle */}
                <div className="flex border border-border rounded-md overflow-hidden text-xs font-medium self-start">
                    <button
                        type="button"
                        onClick={() => setMode("new")}
                        className={`px-3 py-1.5 transition-colors ${mode === "new" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        New Completion
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("link")}
                        className={`px-3 py-1.5 border-l border-border transition-colors ${mode === "link" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Link2 className="h-3 w-3 inline mr-1" />
                        Link Existing
                    </button>
                </div>

                {mode === "new" ? (
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
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Unlinked Completions</p>
                        <p className="text-xs text-muted-foreground">
                            These are manually-logged training completions for the same qualification that aren&apos;t yet linked to an event. Linking will mark this event as completed without re-awarding qualifications.
                        </p>
                        {completionsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </div>
                        ) : unlinkedCompletions.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-2">
                                No unlinked completions found{event.qualificationId ? " for this qualification" : ""}.
                            </p>
                        ) : (
                            <Select value={selectedCompletionId} onValueChange={setSelectedCompletionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a completion record..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {unlinkedCompletions.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            <span className="font-medium">
                                                {format(parseLocalDate(c.trainingDate), "MMM d, yyyy")}
                                            </span>
                                            <span className="text-muted-foreground ml-2">
                                                — {c.traineeCount?.length ?? 0} trainee{(c.traineeCount?.length ?? 0) !== 1 ? "s" : ""}
                                                {c.trainerName ? ` · ${c.trainerNumbers} ${c.trainerName}` : ""}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "link" ? "Link Completion" : "Complete Training"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
