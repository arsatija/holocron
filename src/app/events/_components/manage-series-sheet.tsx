"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface SeriesRow {
    id: string;
    name: string;
    operationType: string;
    dayOfWeek: number;
    eventTime: string | null;
    isActive: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const OP_TYPE_COLORS: Record<string, string> = {
    Main: "bg-blue-600",
    Skirmish: "bg-yellow-600",
    Fun: "bg-green-600",
    Raid: "bg-red-600",
    Joint: "bg-purple-600",
};

interface ManageSeriesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChanged: () => void;
}

export default function ManageSeriesSheet({
    open,
    onOpenChange,
    onChanged,
}: ManageSeriesSheetProps) {
    const [series, setSeries] = useState<SeriesRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [isPending, startTransition] = useTransition();

    // New series form state
    const [newName, setNewName] = useState("");
    const [newOpType, setNewOpType] = useState<string>("Main");
    const [newDayOfWeek, setNewDayOfWeek] = useState<string>("6"); // Saturday default
    const [newTime, setNewTime] = useState("");

    const fetchSeries = () => {
        setLoading(true);
        fetch("/api/v1/event-series")
            .then((r) => r.json())
            .then((data) => setSeries(data.series ?? []))
            .catch(() => toast.error("Failed to load series"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (open) fetchSeries();
    }, [open]);

    const handleCreate = () => {
        if (!newName.trim()) {
            toast.error("Series name is required");
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch("/api/v1/event-series", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: newName.trim(),
                        operationType: newOpType,
                        dayOfWeek: parseInt(newDayOfWeek),
                        eventTime: newTime || null,
                        weeksToGenerate: 8,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error ?? "Failed to create series");
                    return;
                }

                toast.success("Series created — 8 events scheduled");
                setNewName("");
                setNewOpType("Main");
                setNewDayOfWeek("6");
                setNewTime("");
                setShowCreate(false);
                fetchSeries();
                onChanged();
            } catch {
                toast.error("Failed to create series");
            }
        });
    };

    const handleDeactivate = (seriesId: string, seriesName: string) => {
        startTransition(async () => {
            try {
                const res = await fetch("/api/v1/event-series", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ seriesId }),
                });

                if (!res.ok) {
                    toast.error("Failed to deactivate series");
                    return;
                }

                toast.success(`Series "${seriesName}" deactivated`);
                fetchSeries();
                onChanged();
            } catch {
                toast.error("Failed to deactivate series");
            }
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5" />
                        Manage Event Series
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Active series list */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Active Series
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowCreate(!showCreate)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                New Series
                            </Button>
                        </div>

                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : series.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                                No active series. Create one to start scheduling recurring operations.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {series.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white ${OP_TYPE_COLORS[s.operationType] ?? "bg-slate-600"}`}
                                                >
                                                    {s.operationType}
                                                </span>
                                                <p className="font-medium text-sm truncate">{s.name}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {DAY_NAMES[s.dayOfWeek]}
                                                {s.eventTime ? ` @ ${s.eventTime}` : ""}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="shrink-0 text-destructive hover:text-destructive"
                                            onClick={() => handleDeactivate(s.id, s.name)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create form */}
                    {showCreate && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Create New Series
                                </p>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Series Name *</label>
                                    <Input
                                        placeholder="e.g. Saturday Main Op"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Operation Type</label>
                                        <Select value={newOpType} onValueChange={setNewOpType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Main">Main Operation</SelectItem>
                                                <SelectItem value="Skirmish">Skirmish</SelectItem>
                                                <SelectItem value="Fun">Fun Op</SelectItem>
                                                <SelectItem value="Raid">Raid</SelectItem>
                                                <SelectItem value="Joint">Joint Op</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Day of Week</label>
                                        <Select value={newDayOfWeek} onValueChange={setNewDayOfWeek}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAY_NAMES.map((day, i) => (
                                                    <SelectItem key={i} value={String(i)}>
                                                        {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Time (EST, optional)</label>
                                    <Input
                                        placeholder="HH:MM"
                                        value={newTime}
                                        onChange={(e) => setNewTime(e.target.value)}
                                    />
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    This will generate 8 weekly events starting from the next occurrence of the selected day.
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowCreate(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        onClick={handleCreate}
                                        disabled={isPending || !newName.trim()}
                                    >
                                        {isPending ? "Creating..." : "Create Series"}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
