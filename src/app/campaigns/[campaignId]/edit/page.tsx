"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
    Lock,
    Unlock,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Form,
    FormControl,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn, parseLocalDate } from "@/lib/utils";
import { toast } from "sonner";
import TiptapEditor from "@/components/tiptap/editor";
import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

const editCampaignSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .min(1, "Campaign name is required")
        .max(255, "Name too long"),
    description: z.string().optional(),
    story: z.string().optional(),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date().optional().nullable(),
    isActive: z.boolean().default(true),
    plannedOperationCount: z.number().int().min(0).default(0),
});

type EditCampaignFormData = z.infer<typeof editCampaignSchema>;

interface CampaignPhase {
    id: string;
    title: string;
    subtitle: string | null;
    order: number;
    isLocked: boolean;
}

interface OperationData {
    id: string;
    operationType: string;
    operationName: string | null;
    phaseId: string | null;
}

interface CampaignEvent {
    id: string;
    name: string;
    eventDate: string;
    eventKind: string;
    operation: OperationData | null;
}

function SortablePhaseItem({
    phase,
    index,
    editingPhaseId,
    editPhaseTitle,
    editPhaseSubtitle,
    phasesPending,
    setEditPhaseTitle,
    setEditPhaseSubtitle,
    onEdit,
    onCancelEdit,
    onSaveEdit,
    onToggleLock,
    onDelete,
}: {
    phase: CampaignPhase;
    index: number;
    editingPhaseId: string | null;
    editPhaseTitle: string;
    editPhaseSubtitle: string;
    phasesPending: boolean;
    setEditPhaseTitle: (v: string) => void;
    setEditPhaseSubtitle: (v: string) => void;
    onEdit: (id: string, title: string, subtitle: string) => void;
    onCancelEdit: () => void;
    onSaveEdit: (id: string) => void;
    onToggleLock: (phase: CampaignPhase) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: phase.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
    };

    const isEditing = editingPhaseId === phase.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="border border-border rounded-lg p-4 bg-background"
        >
            {isEditing ? (
                <div className="space-y-2">
                    <Input
                        value={editPhaseTitle}
                        onChange={(e) => setEditPhaseTitle(e.target.value)}
                        placeholder="Phase title"
                    />
                    <Textarea
                        value={editPhaseSubtitle}
                        onChange={(e) => setEditPhaseSubtitle(e.target.value)}
                        placeholder="Phase description (optional)"
                        className="resize-none"
                        rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onCancelEdit}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onSaveEdit(phase.id)}
                            disabled={phasesPending}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            {...attributes}
                            {...listeners}
                            className="mt-0.5 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                        <div>
                            <p className="text-[10px] font-mono text-muted-foreground mb-0.5">
                                PHASE {index + 1}
                            </p>
                            <p className="font-semibold text-sm">
                                {phase.title}
                            </p>
                            {phase.subtitle && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {phase.subtitle}
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
                            onClick={() => onToggleLock(phase)}
                            disabled={phasesPending}
                            title={phase.isLocked ? "Unlock phase" : "Lock phase"}
                        >
                            {phase.isLocked ? (
                                <Unlock className="h-3.5 w-3.5" />
                            ) : (
                                <Lock className="h-3.5 w-3.5" />
                            )}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                                onEdit(
                                    phase.id,
                                    phase.title,
                                    phase.subtitle ?? "",
                                )
                            }
                        >
                            Edit
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => onDelete(phase.id)}
                            disabled={phasesPending}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EditCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.campaignId as string;

    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);

    // Phases state
    const [phases, setPhases] = useState<CampaignPhase[]>([]);
    const [phasesPending, setPhasesPending] = useState(false);
    const [newPhaseTitle, setNewPhaseTitle] = useState("");
    const [newPhaseSubtitle, setNewPhaseSubtitle] = useState("");
    const [showAddPhase, setShowAddPhase] = useState(false);
    const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
    const [editPhaseTitle, setEditPhaseTitle] = useState("");
    const [editPhaseSubtitle, setEditPhaseSubtitle] = useState("");

    // Operations state (for phase assignment)
    const [operations, setOperations] = useState<CampaignEvent[]>([]);

    const form = useForm<EditCampaignFormData>({
        resolver: zodResolver(editCampaignSchema),
        defaultValues: {
            id: "",
            name: "",
            description: "",
            story: "",
            startDate: new Date(),
            endDate: null,
            isActive: true,
            plannedOperationCount: 0,
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [campaignRes, phasesRes, eventsRes] = await Promise.all([
                    fetch(`/api/v1/campaigns/${campaignId}`),
                    fetch(`/api/v1/campaigns/${campaignId}/phases`),
                    fetch(`/api/v1/campaign-events?campaignId=${campaignId}`),
                ]);

                if (campaignRes.ok) {
                    const data = await campaignRes.json();
                    form.reset({
                        id: data.id,
                        name: data.name,
                        description: data.description || "",
                        story: data.story || "",
                        startDate: parseLocalDate(data.startDate),
                        endDate: data.endDate
                            ? parseLocalDate(data.endDate)
                            : null,
                        isActive: data.isActive,
                        plannedOperationCount: data.plannedOperationCount ?? 0,
                    });
                } else {
                    toast.error("Failed to load campaign");
                }

                if (phasesRes.ok) {
                    setPhases(await phasesRes.json());
                }

                if (eventsRes.ok) {
                    const evs: CampaignEvent[] = await eventsRes.json();
                    setOperations(
                        evs.filter(
                            (e) => e.eventKind === "Operation" && e.operation,
                        ),
                    );
                }
            } catch {
                toast.error("Failed to load campaign data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [campaignId]);

    const onSubmit = (data: EditCampaignFormData) => {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/v1/campaigns/${campaignId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...data,
                        startDate: data.startDate.toISOString().split("T")[0],
                        endDate: data.endDate
                            ? data.endDate.toISOString().split("T")[0]
                            : null,
                    }),
                });

                if (res.ok) {
                    toast.success("Campaign updated");
                    router.push(`/campaigns/${campaignId}`);
                } else {
                    const err = await res.json();
                    toast.error(err.error || "Failed to update campaign");
                }
            } catch {
                toast.error("Failed to update campaign");
            }
        });
    };

    // ── Phase handlers ─────────────────────────────────────────────────────

    const handleAddPhase = async () => {
        if (!newPhaseTitle.trim()) return;
        setPhasesPending(true);
        try {
            const res = await fetch(`/api/v1/campaigns/${campaignId}/phases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newPhaseTitle.trim(),
                    subtitle: newPhaseSubtitle.trim() || null,
                    order: phases.length,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const newPhase: CampaignPhase = {
                    id: data.id,
                    title: newPhaseTitle.trim(),
                    subtitle: newPhaseSubtitle.trim() || null,
                    order: phases.length,
                    isLocked: false,
                };
                setPhases([...phases, newPhase]);
                setNewPhaseTitle("");
                setNewPhaseSubtitle("");
                setShowAddPhase(false);
                toast.success("Phase added");
            } else {
                toast.error("Failed to add phase");
            }
        } catch {
            toast.error("Failed to add phase");
        } finally {
            setPhasesPending(false);
        }
    };

    const handleSavePhaseEdit = async (phaseId: string) => {
        if (!editPhaseTitle.trim()) return;
        setPhasesPending(true);
        try {
            const res = await fetch(`/api/v1/campaigns/${campaignId}/phases`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: phaseId,
                    title: editPhaseTitle.trim(),
                    subtitle: editPhaseSubtitle.trim() || null,
                }),
            });
            if (res.ok) {
                setPhases(
                    phases.map((p) =>
                        p.id === phaseId
                            ? {
                                  ...p,
                                  title: editPhaseTitle.trim(),
                                  subtitle: editPhaseSubtitle.trim() || null,
                              }
                            : p,
                    ),
                );
                setEditingPhaseId(null);
                toast.success("Phase updated");
            } else {
                toast.error("Failed to update phase");
            }
        } catch {
            toast.error("Failed to update phase");
        } finally {
            setPhasesPending(false);
        }
    };

    const handleDeletePhase = async (phaseId: string) => {
        setPhasesPending(true);
        try {
            const res = await fetch(
                `/api/v1/campaigns/${campaignId}/phases?phaseId=${phaseId}`,
                { method: "DELETE" },
            );
            if (res.ok) {
                setPhases(phases.filter((p) => p.id !== phaseId));
                // Clear phase assignment from local ops list
                setOperations(
                    operations.map((e) =>
                        e.operation?.phaseId === phaseId
                            ? {
                                  ...e,
                                  operation: e.operation
                                      ? {
                                            ...e.operation,
                                            phaseId: null,
                                        }
                                      : null,
                              }
                            : e,
                    ),
                );
                toast.success("Phase deleted");
            } else {
                toast.error("Failed to delete phase");
            }
        } catch {
            toast.error("Failed to delete phase");
        } finally {
            setPhasesPending(false);
        }
    };

    const handleTogglePhaseLock = async (phase: CampaignPhase) => {
        setPhasesPending(true);
        try {
            const res = await fetch(`/api/v1/campaigns/${campaignId}/phases`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: phase.id, isLocked: !phase.isLocked }),
            });
            if (res.ok) {
                setPhases(
                    phases.map((p) =>
                        p.id === phase.id ? { ...p, isLocked: !phase.isLocked } : p,
                    ),
                );
                toast.success(phase.isLocked ? "Phase unlocked" : "Phase locked");
            } else {
                toast.error("Failed to update phase");
            }
        } catch {
            toast.error("Failed to update phase");
        } finally {
            setPhasesPending(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = phases.findIndex((p) => p.id === active.id);
        const newIndex = phases.findIndex((p) => p.id === over.id);
        const reordered = arrayMove(phases, oldIndex, newIndex).map((p, i) => ({
            ...p,
            order: i,
        }));
        setPhases(reordered);

        try {
            await Promise.all(
                reordered.map((p) =>
                    fetch(`/api/v1/campaigns/${campaignId}/phases`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: p.id, order: p.order }),
                    }),
                ),
            );
        } catch {
            toast.error("Failed to reorder phases");
        }
    };

    // ── Operation phase assignment ─────────────────────────────────────────

    const handleAssignPhase = async (
        eventId: string,
        phaseId: string | null,
    ) => {
        try {
            const res = await fetch("/api/v1/campaign-events", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: eventId,
                    phaseId: phaseId,
                }),
            });
            if (res.ok) {
                setOperations(
                    operations.map((e) =>
                        e.id === eventId
                            ? {
                                  ...e,
                                  operation: e.operation
                                      ? { ...e.operation, phaseId }
                                      : null,
                              }
                            : e,
                    ),
                );
            } else {
                toast.error("Failed to assign phase");
            }
        } catch {
            toast.error("Failed to assign phase");
        }
    };

    if (loading) {
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
                <div className="container mx-auto p-6 flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-accent9th" />
                </div>
            </ProtectedRoute>
        );
    }

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
                    onClick={() => router.push(`/campaigns/${campaignId}`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaign
                </Button>

                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">
                        Edit Campaign
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Update campaign details, story, and phases
                    </p>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        {/* ── Basic Info ────────────────────────────── */}
                        <section>
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-4">
                                Basic Information
                            </h2>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter campaign name"
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
                                            <FormLabel>
                                                Short Description
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Brief one-line summary shown on the campaign card"
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
                                                <FormLabel>
                                                    Start Date
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
                                                            selected={
                                                                field.value
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
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>
                                                    End Date (optional)
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
                                                        {...field}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* ── Situation Report / Story ──────────────── */}
                        <section>
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-1">
                                Situation Report
                            </h2>
                            <p className="text-xs text-muted-foreground mb-4">
                                The campaign narrative shown on the detail page
                                — background, context, and objectives.
                            </p>
                            <FormField
                                control={form.control}
                                name="story"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <TiptapEditor
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                editable={true}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </section>

                        <Separator />

                        {/* ── Campaign Phases ───────────────────────────────── */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                        Campaign Phases
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Organize operations into named phases
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
                                            onClick={handleAddPhase}
                                            disabled={
                                                phasesPending ||
                                                !newPhaseTitle.trim()
                                            }
                                        >
                                            {phasesPending && (
                                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                            )}
                                            Add Phase
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {phases.length === 0 ? (
                                <div className="border border-dashed border-border rounded-lg p-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No phases defined yet
                                    </p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={phases.map((p) => p.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {phases.map((phase, i) => (
                                                <SortablePhaseItem
                                                    key={phase.id}
                                                    phase={phase}
                                                    index={i}
                                                    editingPhaseId={editingPhaseId}
                                                    editPhaseTitle={editPhaseTitle}
                                                    editPhaseSubtitle={editPhaseSubtitle}
                                                    phasesPending={phasesPending}
                                                    setEditPhaseTitle={setEditPhaseTitle}
                                                    setEditPhaseSubtitle={setEditPhaseSubtitle}
                                                    onEdit={(id, title, subtitle) => {
                                                        setEditingPhaseId(id);
                                                        setEditPhaseTitle(title);
                                                        setEditPhaseSubtitle(subtitle);
                                                    }}
                                                    onCancelEdit={() => setEditingPhaseId(null)}
                                                    onSaveEdit={handleSavePhaseEdit}
                                                    onToggleLock={handleTogglePhaseLock}
                                                    onDelete={handleDeletePhase}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </section>

                        {/* ── Operation Phase Assignment ──────────────────────── */}
                        {operations.length > 0 && phases.length > 0 && (
                            <>
                                <Separator className="my-8" />
                                <section className="space-y-4">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                            Operation Phase Assignment
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Assign each operation to a campaign
                                            phase
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {operations.map((event) => (
                                            <div
                                                key={event.id}
                                                className="border border-border rounded-lg p-3 flex items-center justify-between gap-4"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {event.operation
                                                            ?.operationName
                                                            ? `Operation ${event.operation.operationName}`
                                                            : event.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {event.eventDate}
                                                    </p>
                                                </div>
                                                <Select
                                                    value={
                                                        event.operation
                                                            ?.phaseId ?? "none"
                                                    }
                                                    onValueChange={(val) =>
                                                        handleAssignPhase(
                                                            event.id,
                                                            val === "none"
                                                                ? null
                                                                : val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-48 h-8 text-sm">
                                                        <SelectValue placeholder="No phase" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            No phase
                                                        </SelectItem>
                                                        {phases.map(
                                                            (phase, i) => (
                                                                <SelectItem
                                                                    key={
                                                                        phase.id
                                                                    }
                                                                    value={
                                                                        phase.id
                                                                    }
                                                                >
                                                                    Phase{" "}
                                                                    {i + 1}:{" "}
                                                                    {
                                                                        phase.title
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}
                        {/* ── Save button ───────────────────────────── */}
                        <div className="flex gap-4 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.push(`/campaigns/${campaignId}`)
                                }
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Campaign
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ProtectedRoute>
    );
}
