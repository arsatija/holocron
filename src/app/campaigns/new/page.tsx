"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
    CalendarIcon,
    Loader2,
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import TiptapEditor from "@/components/tiptap/editor";
import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

const createCampaignSchema = z.object({
    name: z
        .string()
        .min(1, "Campaign name is required")
        .max(255, "Name too long"),
    description: z.string().optional(),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date().optional().nullable(),
    isActive: z.boolean().default(true),
    plannedOperationCount: z.number().int().min(0).default(0),
});

type CreateCampaignFormData = z.infer<typeof createCampaignSchema>;

interface PhaseDraft {
    localId: string;
    title: string;
    subtitle: string;
}

export default function CreateCampaignPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [story, setStory] = useState("");

    // Phases state
    const [phases, setPhases] = useState<PhaseDraft[]>([]);
    const [showAddPhase, setShowAddPhase] = useState(false);
    const [newPhaseTitle, setNewPhaseTitle] = useState("");
    const [newPhaseSubtitle, setNewPhaseSubtitle] = useState("");
    const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editSubtitle, setEditSubtitle] = useState("");

    const form = useForm<CreateCampaignFormData>({
        resolver: zodResolver(createCampaignSchema),
        defaultValues: {
            name: "",
            description: "",
            startDate: new Date(),
            endDate: null,
            isActive: true,
            plannedOperationCount: 0,
        },
    });

    // ── Phase helpers ──────────────────────────────────────────────────────

    const addPhase = () => {
        if (!newPhaseTitle.trim()) return;
        setPhases([
            ...phases,
            {
                localId: crypto.randomUUID(),
                title: newPhaseTitle.trim(),
                subtitle: newPhaseSubtitle.trim(),
            },
        ]);
        setNewPhaseTitle("");
        setNewPhaseSubtitle("");
        setShowAddPhase(false);
    };

    const savePhaseEdit = (localId: string) => {
        if (!editTitle.trim()) return;
        setPhases(
            phases.map((p) =>
                p.localId === localId
                    ? {
                          ...p,
                          title: editTitle.trim(),
                          subtitle: editSubtitle.trim(),
                      }
                    : p,
            ),
        );
        setEditingLocalId(null);
    };

    const deletePhase = (localId: string) => {
        setPhases(phases.filter((p) => p.localId !== localId));
    };

    const movePhase = (localId: string, direction: "up" | "down") => {
        const idx = phases.findIndex((p) => p.localId === localId);
        if (direction === "up" && idx === 0) return;
        if (direction === "down" && idx === phases.length - 1) return;
        const next = [...phases];
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        setPhases(next);
    };

    // ── Submit ─────────────────────────────────────────────────────────────

    const onSubmit = (data: CreateCampaignFormData) => {
        startTransition(async () => {
            try {
                // 1. Create the campaign
                const res = await fetch("/api/v1/campaigns", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: data.name,
                        description: data.description || "",
                        story: story || null,
                        startDate: data.startDate.toISOString().split("T")[0],
                        endDate: data.endDate
                            ? data.endDate.toISOString().split("T")[0]
                            : null,
                        isActive: data.isActive,
                        plannedOperationCount: data.plannedOperationCount,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error || "Failed to create campaign");
                    return;
                }

                const { id: campaignId } = await res.json();

                // 2. Create phases in order
                if (phases.length > 0) {
                    await Promise.all(
                        phases.map((phase, i) =>
                            fetch(`/api/v1/campaigns/${campaignId}/phases`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    title: phase.title,
                                    subtitle: phase.subtitle || null,
                                    order: i,
                                }),
                            }),
                        ),
                    );
                }

                toast.success("Campaign created");
                router.push(`/campaigns/${campaignId}`);
            } catch {
                toast.error("Failed to create campaign");
            }
        });
    };

    return (
        <ProtectedRoute
            allowedPermissions={[
                RankLevel.Command,
                RankLevel.Company,
                "sgd:2ic",
                "sgd-lore:2ic",
                "admin:2ic",
            ]}
        >
            <div className="container mx-auto p-4 md:p-6 max-w-4xl">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => router.push("/campaigns")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaigns
                </Button>

                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">
                        Create Campaign
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Set up a new campaign to organize operations and track
                        progress
                    </p>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        {/* ── Campaign Details ───────────────────────── */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Campaign Details
                            </h2>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Campaign Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Operation Iron Fist"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Short Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="One-line summary shown on the campaigns list"
                                                className="resize-none"
                                                rows={2}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value
                                                                ? format(
                                                                      field.value,
                                                                      "PPP",
                                                                  )
                                                                : "Pick a date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                End Date{" "}
                                                <span className="text-muted-foreground font-normal">
                                                    (optional)
                                                </span>
                                            </FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value
                                                                ? format(
                                                                      field.value,
                                                                      "PPP",
                                                                  )
                                                                : "Not set"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={
                                                            field.value ||
                                                            undefined
                                                        }
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="plannedOperationCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Planned Operations
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    placeholder="0"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Used for progress tracking
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* ── Situation Report ──────────────────────── */}
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-1">
                                    Campaign Story
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Campaign narrative — background, context,
                                    and strategic objectives
                                </p>
                            </div>
                            <TiptapEditor
                                value={story}
                                onChange={setStory}
                                editable={true}
                            />
                        </section>

                        <Separator />

                        {/* ── Campaign Phases ───────────────────────── */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-1">
                                        Campaign Phases
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Optionally divide the campaign into
                                        named phases
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setShowAddPhase(!showAddPhase)
                                    }
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add Phase
                                </Button>
                            </div>

                            {showAddPhase && (
                                <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        New Phase
                                    </p>
                                    <Input
                                        placeholder="Phase title (e.g. Reconnaissance)"
                                        value={newPhaseTitle}
                                        onChange={(e) =>
                                            setNewPhaseTitle(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addPhase();
                                            }
                                        }}
                                    />
                                    <Textarea
                                        placeholder="Phase description (optional)"
                                        value={newPhaseSubtitle}
                                        onChange={(e) =>
                                            setNewPhaseSubtitle(e.target.value)
                                        }
                                        className="resize-none"
                                        rows={2}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setShowAddPhase(false);
                                                setNewPhaseTitle("");
                                                setNewPhaseSubtitle("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addPhase}
                                            disabled={!newPhaseTitle.trim()}
                                        >
                                            Add Phase
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {phases.length === 0 && !showAddPhase ? (
                                <div className="border border-dashed border-border rounded-lg p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No phases — you can add them after
                                        creation too
                                    </p>
                                </div>
                            ) : (
                                phases.length > 0 && (
                                    <div className="space-y-2">
                                        {phases.map((phase, i) => (
                                            <div
                                                key={phase.localId}
                                                className="border border-border rounded-lg p-4"
                                            >
                                                {editingLocalId ===
                                                phase.localId ? (
                                                    <div className="space-y-2">
                                                        <Input
                                                            value={editTitle}
                                                            onChange={(e) =>
                                                                setEditTitle(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Phase title"
                                                        />
                                                        <Textarea
                                                            value={editSubtitle}
                                                            onChange={(e) =>
                                                                setEditSubtitle(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Phase description (optional)"
                                                            className="resize-none"
                                                            rows={2}
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setEditingLocalId(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() =>
                                                                    savePhaseEdit(
                                                                        phase.localId,
                                                                    )
                                                                }
                                                            >
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-[10px] font-mono text-muted-foreground mb-0.5">
                                                                    PHASE{" "}
                                                                    {i + 1}
                                                                </p>
                                                                <p className="font-semibold text-sm">
                                                                    {
                                                                        phase.title
                                                                    }
                                                                </p>
                                                                {phase.subtitle && (
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        {
                                                                            phase.subtitle
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7"
                                                                onClick={() =>
                                                                    movePhase(
                                                                        phase.localId,
                                                                        "up",
                                                                    )
                                                                }
                                                                disabled={
                                                                    i === 0
                                                                }
                                                            >
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7"
                                                                onClick={() =>
                                                                    movePhase(
                                                                        phase.localId,
                                                                        "down",
                                                                    )
                                                                }
                                                                disabled={
                                                                    i ===
                                                                    phases.length -
                                                                        1
                                                                }
                                                            >
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 text-xs"
                                                                onClick={() => {
                                                                    setEditingLocalId(
                                                                        phase.localId,
                                                                    );
                                                                    setEditTitle(
                                                                        phase.title,
                                                                    );
                                                                    setEditSubtitle(
                                                                        phase.subtitle,
                                                                    );
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                                onClick={() =>
                                                                    deletePhase(
                                                                        phase.localId,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </section>

                        <Separator />

                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/campaigns")}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Campaign
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ProtectedRoute>
    );
}
