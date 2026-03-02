"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    ArrowLeft,
    Plus,
    Trash2,
    ChevronsUpDown,
    Check,
    Loader2,
    Clock,
    CalendarIcon,
    AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import Link from "next/link";

import { createEvent } from "@/services/events";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";
import { getFullTrooperName } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

interface TrooperOption {
    id: string;
    name: string;
    numbers: number;
    rank: number;
}
interface QualOption {
    id: string;
    name: string;
    abbreviation: string;
}
interface CampaignOption {
    id: string;
    name: string;
}

interface Props {
    troopers: TrooperOption[];
    qualifications: QualOption[];
    campaigns: CampaignOption[];
}

type EventKindTab = "Operation" | "Training" | "Meeting" | "Social";

const FULL_BRIEF_TYPES = ["Main", "Raid", "Joint"] as const;

const formSchema = z.object({
    eventKind: z.enum(["Operation", "Training", "Meeting", "Social"]),
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().optional(),
    eventDate: z.string().min(1, "Date is required"),
    eventTime: z.string().optional(),
    eventEndTime: z.string().optional(),
    bannerImage: z.string().optional(),
    campaignId: z.string().optional(),
    // Operation fields
    operationType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint"]).optional(),
    operationName: z.string().optional(),
    transmittedById: z.string().optional(),
    deployedForces: z.array(z.object({ name: z.string(), optional: z.boolean().default(false) })).default([]),
    objectives: z
        .array(z.object({ title: z.string().min(1, "Title required"), description: z.string().default("") }))
        .default([]),
    situationReport: z.string().optional(),
    eventNotes: z.string().optional(),
    // Training fields
    qualificationId: z.string().optional(),
    scheduledTrainerId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Searchable trooper combobox
function TrooperCombobox({
    value,
    onChange,
    troopers,
    placeholder = "Select trooper...",
}: {
    value: string | undefined;
    onChange: (val: string | undefined) => void;
    troopers: TrooperOption[];
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const selected = troopers.find((t) => t.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                >
                    {selected
                        ? `${selected.numbers} ${selected.name}`
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search by name or number..." />
                    <CommandList>
                        <CommandEmpty>No trooper found.</CommandEmpty>
                        <CommandGroup>
                            {value && (
                                <CommandItem
                                    value="__clear__"
                                    onSelect={() => {
                                        onChange(undefined);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="text-muted-foreground italic">
                                        Clear selection
                                    </span>
                                </CommandItem>
                            )}
                            {troopers.map((t) => (
                                <CommandItem
                                    key={t.id}
                                    value={`${t.numbers} ${t.name}`}
                                    onSelect={() => {
                                        onChange(t.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === t.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {t.numbers} {t.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function CreateEventForm({
    troopers,
    qualifications,
    campaigns,
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { trooperCtx } = useController();
    const [availableTimes, setAvailableTimes] = useState<string[] | null>(null);
    const [existingOperationTimes, setExistingOperationTimes] = useState<string[]>([]);
    const [loadingTimes, setLoadingTimes] = useState(false);

    // Per-kind permission checks
    const canCreateOperation = checkPermissionsSync(trooperCtx, ["Zeus", "Admin", RankLevel.Command]);
    const canCreateTraining = checkPermissionsSync(trooperCtx, ["Training", "Admin", RankLevel.Command]);
    const canCreateMeeting = checkPermissionsSync(trooperCtx, [
        RankLevel.Company,
        RankLevel.Command,
        "Admin",
    ]);
    const canCreateSocial = checkPermissionsSync(trooperCtx, [
        RankLevel.JNCO,
        RankLevel.SNCO,
        RankLevel.Company,
        RankLevel.Command,
        "Admin",
    ]);

    const allowedKinds: EventKindTab[] = [
        ...(canCreateOperation ? (["Operation"] as EventKindTab[]) : []),
        ...(canCreateTraining ? (["Training"] as EventKindTab[]) : []),
        ...(canCreateMeeting ? (["Meeting"] as EventKindTab[]) : []),
        ...(canCreateSocial ? (["Social"] as EventKindTab[]) : []),
    ];

    const defaultKind: EventKindTab = allowedKinds[0] ?? "Operation";

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            eventKind: defaultKind,
            name: "",
            description: "",
            eventDate: "",
            eventTime: "",
            eventEndTime: "",
            bannerImage: "",
            campaignId: "",
            operationType: "Main",
            operationName: "",
            transmittedById: "",
            deployedForces: [],
            objectives: [],
            situationReport: "",
            eventNotes: "",
            qualificationId: "",
            scheduledTrainerId: "",
        },
    });

    const eventKind = form.watch("eventKind");
    const watchedDate = form.watch("eventDate");
    const watchedTime = form.watch("eventTime");
    const watchedOpType = form.watch("operationType") ?? "Main";
    const isOperation = eventKind === "Operation";
    const isTraining = eventKind === "Training";
    const isFullBrief = (FULL_BRIEF_TYPES as readonly string[]).includes(watchedOpType);

    // Fetch available time slots when kind=Operation and a date is chosen
    useEffect(() => {
        if (!isOperation || !watchedDate) {
            setAvailableTimes(null);
            setExistingOperationTimes([]);
            return;
        }
        setLoadingTimes(true);
        fetch(`/api/v1/events/available-times?date=${watchedDate}`)
            .then((r) => r.json())
            .then((data: { available: string[]; existingTimes: string[] }) => {
                setAvailableTimes(data.available ?? []);
                setExistingOperationTimes(data.existingTimes ?? []);
            })
            .catch(() => { setAvailableTimes([]); setExistingOperationTimes([]); })
            .finally(() => setLoadingTimes(false));
    }, [isOperation, watchedDate]);

    // Conflict check: is the manually entered time within 210 min of an existing op?
    function parseMinutes(hhmm: string): number {
        const [h, m] = hhmm.split(":").map(Number);
        return isNaN(h) || isNaN(m) ? NaN : h * 60 + m;
    }

    const timeConflict = (() => {
        if (!watchedTime || !isOperation || existingOperationTimes.length === 0) return null;
        const entered = parseMinutes(watchedTime);
        if (isNaN(entered)) return null;
        return existingOperationTimes.find((t) => Math.abs(entered - parseMinutes(t)) < 210) ?? null;
    })();

    // ─── Training auto-name ───────────────────────────────────────────────
    const [trainingSuffix, setTrainingSuffix] = useState("");

    const watchedTrainerId = form.watch("scheduledTrainerId");
    const watchedQualId = form.watch("qualificationId");

    // Build the base portion: "CC-6666 "Rav" - Medic"
    const trainingBaseName = (() => {
        const trainer = troopers.find((t) => t.id === watchedTrainerId);
        const qual = qualifications.find((q) => q.id === watchedQualId);
        const parts: string[] = [];
        if (trainer) parts.push(getFullTrooperName(trainer));
        if (qual) parts.push(qual.name);
        return parts.join(" - ");
    })();

    const trainingFullName = [trainingBaseName, trainingSuffix.trim()].filter(Boolean).join(" ");

    // Keep the hidden name field in sync so Zod validation passes
    useEffect(() => {
        if (isTraining) {
            form.setValue("name", trainingFullName || "", { shouldValidate: false });
        } else if (isOperation) {
            // Auto-set name to type label so validation passes
            const label = operationTypeLabels[watchedOpType] ?? "Operation";
            form.setValue("name", label, { shouldValidate: false });
        }
    }, [isTraining, trainingFullName, isOperation, watchedOpType, form]);

    // Auto-name labels for operation event types
    const operationTypeLabels: Record<string, string> = {
        Main: "Main Operation",
        Skirmish: "Skirmish",
        Fun: "Fun Op",
        Raid: "Raid",
        Joint: "Joint Op",
    };

    const {
        fields: objectiveFields,
        append: appendObjective,
        remove: removeObjective,
    } = useFieldArray({ control: form.control, name: "objectives" });

    const {
        fields: forceFields,
        append: appendForce,
        remove: removeForce,
    } = useFieldArray({
        control: form.control,
        name: "deployedForces" as never,
    });

    const onSubmit = (data: FormValues) => {
        startTransition(async () => {
            try {
                // For operations, auto-set the base name to the type label
                const resolvedName = isTraining
                    ? trainingFullName
                    : isOperation
                    ? (operationTypeLabels[data.operationType ?? "Main"] ?? data.name)
                    : data.name;

                const result = await createEvent({
                    name: resolvedName,
                    description: data.description || undefined,
                    bannerImage: data.bannerImage || null,
                    eventDate: data.eventDate,
                    eventTime: data.eventTime || undefined,
                    eventEndTime: isTraining ? (data.eventEndTime || null) : null,
                    eventKind: data.eventKind,
                    campaignId: (data.campaignId && data.campaignId !== "none") ? data.campaignId : null,
                    ...(isOperation && {
                        operationType: data.operationType ?? "Main",
                        operationName: data.operationName || null,
                        transmittedById: data.transmittedById || null,
                        deployedForces: data.deployedForces.filter((f) => f.name.trim()),
                        objectives: data.objectives.length > 0 ? data.objectives : null,
                        situationReport: data.situationReport || undefined,
                        eventNotes: data.eventNotes || undefined,
                    }),
                    ...(isTraining && {
                        qualificationId: data.qualificationId || null,
                        scheduledTrainerId: data.scheduledTrainerId || null,
                    }),
                });

                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }

                toast.success("Event created successfully");
                router.push("/events");
            } catch {
                toast.error("Failed to create event");
            }
        });
    };

    if (allowedKinds.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">
                        You do not have permission to create events.
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href="/events">Back to Events</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="relative w-full bg-background border-b border-border overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.12] dark:opacity-[0.35]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                        maskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                    }}
                />
                <div className="relative container mx-auto px-4 py-10 md:py-14 text-center">
                    <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                        9th Assault Corps
                    </p>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#993534]">
                        Create Event
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Schedule a new operation, training session, meeting, or social event.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back link */}
                <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Events
                </Link>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Event Kind tabs */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Event Type</p>
                            <div className="flex gap-2 flex-wrap">
                                {allowedKinds.map((kind) => (
                                    <button
                                        key={kind}
                                        type="button"
                                        onClick={() => form.setValue("eventKind", kind)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                            eventKind === kind
                                                ? "bg-[#993534] text-white border-[#993534]"
                                                : "border-border text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {kind}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Basic info */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                                Basic Info
                            </h2>

                            {/* Name field — hidden for Training (auto-generated) and Operations (type label used) */}
                            {isTraining ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Training Name</p>
                                    {trainingBaseName ? (
                                        <p className="text-sm font-semibold text-foreground px-1">
                                            {trainingFullName || trainingBaseName}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground px-1 italic">
                                            Select a trainer and/or qualification below to generate the name
                                        </p>
                                    )}
                                    <Input
                                        placeholder="Additional details, e.g. Day 2 (optional)"
                                        value={trainingSuffix}
                                        onChange={(e) => setTrainingSuffix(e.target.value)}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                                    )}
                                </div>
                            ) : isOperation ? (
                                // Operations use the type label as name — just show a note
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Event Name</p>
                                    <p className="text-sm text-muted-foreground px-1 italic">
                                        Auto-set to operation type (e.g. &ldquo;Main Operation&rdquo;). Use the Operation Name field below to give it a specific name.
                                    </p>
                                </div>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter event name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="eventDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date *</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? format(parseLocalDate(field.value), "PPP")
                                                                : "Pick a date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? parseLocalDate(field.value) : undefined}
                                                        onSelect={(date) =>
                                                            field.onChange(date ? format(date, "yyyy-MM-dd") : "")
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
                                    name="eventTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{isTraining ? "Start Time (EST)" : "Time (EST)"}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="HH:MM"
                                                        className="pl-9"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                24-hour EST
                                            </FormDescription>
                                            {/* Available time suggestions (Operations only) */}
                                            {isOperation && (
                                                <div className="mt-2">
                                                    {loadingTimes ? (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            Checking availability...
                                                        </p>
                                                    ) : !watchedDate ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            Select a date to see available slots
                                                        </p>
                                                    ) : availableTimes && availableTimes.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            No available slots on this date
                                                        </p>
                                                    ) : availableTimes && availableTimes.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {availableTimes.map((slot) => (
                                                                <button
                                                                    key={slot}
                                                                    type="button"
                                                                    onClick={() => form.setValue("eventTime", slot)}
                                                                    className={cn(
                                                                        "px-2 py-0.5 rounded-full text-xs border transition-colors",
                                                                        watchedTime === slot
                                                                            ? "bg-[#993534] text-white border-[#993534]"
                                                                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                                                                    )}
                                                                >
                                                                    {slot}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                    {/* Conflict warning for manually entered times */}
                                                    {timeConflict && (
                                                        <p className="flex items-start gap-1.5 text-xs text-orange-500 mt-2">
                                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                            This time conflicts with an existing operation at {timeConflict} EST. Operations must be at least 3:30 apart.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* End Time — Training events only */}
                            {isTraining && (
                                <FormField
                                    control={form.control}
                                    name="eventEndTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Time (EST)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="HH:MM"
                                                        className="pl-9"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                24-hour EST
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Optional event description"
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bannerImage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Banner Image URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Operation-specific fields */}
                        {isOperation && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                                    Operation Details
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="operationType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Operation Type</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value ?? "Main"}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {["Main", "Skirmish", "Fun", "Raid", "Joint"].map(
                                                            (t) => (
                                                                <SelectItem key={t} value={t}>
                                                                    {t}
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="campaignId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Campaign</FormLabel>
                                                <Select
                                                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                                                    value={field.value || "none"}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Standalone" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            Standalone (no campaign)
                                                        </SelectItem>
                                                        {campaigns.map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="operationName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Operation Name{isFullBrief ? "" : " (optional)"}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={
                                                        isFullBrief
                                                            ? "Give this operation a name"
                                                            : "Optional name for this operation"
                                                    }
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="transmittedById"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Zeus (Transmitted By){isFullBrief ? " *" : " (optional)"}
                                            </FormLabel>
                                            <FormControl>
                                                <TrooperCombobox
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    troopers={troopers}
                                                    placeholder="Search for Zeus..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Objectives — numbered list */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">
                                            Objectives{isFullBrief ? " *" : " (optional)"}
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                appendObjective({ title: "", description: "" })
                                            }
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Objective
                                        </Button>
                                    </div>
                                    {objectiveFields.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            No objectives added yet.
                                        </p>
                                    )}
                                    <ol className="space-y-3 list-none">
                                        {objectiveFields.map((fieldItem, index) => (
                                            <li key={fieldItem.id} className="flex gap-2">
                                                <span className="mt-2 text-sm font-semibold text-muted-foreground w-5 text-right shrink-0">
                                                    {index + 1}.
                                                </span>
                                                <div className="flex-1 space-y-1.5">
                                                    <FormField
                                                        control={form.control}
                                                        name={`objectives.${index}.title`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Objective title"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`objectives.${index}.description`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Description (optional)"
                                                                        className="resize-none text-sm"
                                                                        rows={2}
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="mt-1 shrink-0"
                                                    onClick={() => removeObjective(index)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="situationReport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Situation Report (SITREP){isFullBrief ? " *" : " (optional)"}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Current situation and context..."
                                                    className="resize-none"
                                                    rows={4}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Deployed Forces */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Deployed Forces</p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => appendForce({ name: "", optional: false } as never)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    {forceFields.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            No forces added yet.
                                        </p>
                                    )}
                                    {forceFields.map((fieldItem, index) => (
                                        <div key={fieldItem.id} className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`deployedForces.${index}.name` as never}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. Alpha Company"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => removeForce(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="eventNotes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional notes..."
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Training-specific fields */}
                        {isTraining && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                                    Training Details
                                </h2>

                                <FormField
                                    control={form.control}
                                    name="qualificationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Qualification</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value ?? ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select qualification" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {qualifications.map((q) => (
                                                        <SelectItem key={q.id} value={q.id}>
                                                            {q.abbreviation} — {q.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="scheduledTrainerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Scheduled Trainer</FormLabel>
                                            <FormControl>
                                                <TrooperCombobox
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    troopers={troopers}
                                                    placeholder="Search for trainer..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Event
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
