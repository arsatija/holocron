"use client";

import { useState, useTransition, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Clock, Plus, Trash2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SelectOption {
    value: string;
    label: string;
}

const createEventSchema = z.object({
    name: z.string().min(1, "Event name is required").max(255),
    description: z.string().optional(),
    eventDate: z.date({ required_error: "Event date is required" }),
    eventTime: z.string().optional(),
    eventKind: z.enum(["Operation", "Training", "Meeting"]),
    campaignId: z.string().optional(),
    // Operation-specific
    operationType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint", "Social"]).optional(),
    transmittedById: z.string().optional(),
    objectives: z.string().optional(),
    situationReport: z.string().optional(),
    eventNotes: z.string().optional(),
    deployedForces: z.array(z.string()).optional(),
    // Training-specific
    qualificationId: z.string().optional(),
    scheduledTrainerId: z.string().optional(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEventCreated: () => void;
}

export default function CreateEventDialog({
    open,
    onOpenChange,
    onEventCreated,
}: CreateEventDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [campaigns, setCampaigns] = useState<SelectOption[]>([]);
    const [qualifications, setQualifications] = useState<SelectOption[]>([]);
    const [trainers, setTrainers] = useState<SelectOption[]>([]);
    const [troopers, setTroopers] = useState<SelectOption[]>([]);
    const [deployedForces, setDeployedForces] = useState<string[]>([]);

    const form = useForm<CreateEventFormData>({
        resolver: zodResolver(createEventSchema),
        defaultValues: {
            name: "",
            description: "",
            eventDate: new Date(),
            eventTime: "",
            eventKind: "Operation",
            operationType: "Main",
            eventNotes: "",
        },
    });

    const eventKind = form.watch("eventKind");
    const isOperation = eventKind === "Operation";
    const isTraining = eventKind === "Training";

    useEffect(() => {
        if (!open) return;
        Promise.all([
            fetch("/api/v1/campaigns").then((r) => r.json()),
            fetch("/api/v1/qualificationList").then((r) => r.json()),
            fetch("/api/v1/trainersList").then((r) => r.json()),
            fetch("/api/v1/troopersList").then((r) => r.json()),
        ])
            .then(([campaignData, qualData, trainerData, trooperData]) => {
                setCampaigns(
                    (campaignData as { id: string; name: string }[]).map(
                        (c) => ({ value: c.id, label: c.name })
                    )
                );
                setQualifications(qualData as SelectOption[]);
                setTrainers(trainerData as SelectOption[]);
                setTroopers(trooperData as SelectOption[]);
            })
            .catch(() => {});
    }, [open]);

    // Reset deployedForces when dialog closes or kind changes
    useEffect(() => {
        if (!open) {
            setDeployedForces([]);
            form.reset({
                name: "",
                description: "",
                eventDate: new Date(),
                eventTime: "",
                eventKind: "Operation",
                operationType: "Main",
                eventNotes: "",
            });
        }
    }, [open]);

    const addDeployedForce = () => setDeployedForces((prev) => [...prev, ""]);
    const updateDeployedForce = (idx: number, val: string) =>
        setDeployedForces((prev) => prev.map((f, i) => (i === idx ? val : f)));
    const removeDeployedForce = (idx: number) =>
        setDeployedForces((prev) => prev.filter((_, i) => i !== idx));

    const onSubmit = (data: CreateEventFormData) => {
        startTransition(async () => {
            try {
                const payload: Record<string, unknown> = {
                    name: data.name,
                    description: data.description,
                    eventDate: data.eventDate.toISOString().split("T")[0],
                    eventTime: data.eventTime || null,
                    eventKind: data.eventKind,
                    campaignId: data.campaignId || null,
                };

                if (isOperation) {
                    payload.operationType = data.operationType ?? "Main";
                    payload.transmittedById = data.transmittedById || null;
                    payload.objectives = data.objectives || null;
                    payload.situationReport = data.situationReport || null;
                    payload.eventNotes = data.eventNotes || null;
                    payload.deployedForces = deployedForces.filter(Boolean);
                } else if (isTraining) {
                    payload.qualificationId = data.qualificationId || null;
                    payload.scheduledTrainerId = data.scheduledTrainerId || null;
                }

                const res = await fetch("/api/v1/campaign-events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    toast.success("Event created successfully");
                    onEventCreated();
                    onOpenChange(false);
                } else {
                    const err = await res.json();
                    toast.error(err.error || "Failed to create event");
                }
            } catch {
                toast.error("Failed to create event");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Event</DialogTitle>
                    <DialogDescription>
                        Schedule an operation, training session, or meeting.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter event name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Optional description"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date + Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="eventDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
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
                                                            ? format(field.value, "PPP")
                                                            : "Pick a date"}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
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
                                        <FormLabel>Time (EST)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="HH:MM"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            24-hour format
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Event Kind */}
                        <FormField
                            control={form.control}
                            name="eventKind"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Kind</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select kind" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {["Operation", "Training", "Meeting"].map((k) => (
                                                <SelectItem key={k} value={k}>
                                                    {k}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Campaign (optional — only shown for Operation) */}
                        {isOperation && (
                            <FormField
                                control={form.control}
                                name="campaignId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Campaign (optional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Standalone (no campaign)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {campaigns.map((c) => (
                                                    <SelectItem key={c.value} value={c.value}>
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Operation-specific fields */}
                        {isOperation && (
                            <>
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
                                                    {["Main", "Skirmish", "Fun", "Raid", "Joint", "Social"].map((t) => (
                                                        <SelectItem key={t} value={t}>
                                                            {t}
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
                                    name="transmittedById"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zeus (optional)</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value ?? ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select zeus" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {troopers.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {t.label}
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
                                    name="objectives"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Objectives</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Mission objectives..."
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="situationReport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Situation Report</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="SITREP..."
                                                    className="resize-none"
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
                                        <FormLabel>Deployed Forces</FormLabel>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={addDeployedForce}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    {deployedForces.map((force, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={force}
                                                onChange={(e) =>
                                                    updateDeployedForce(idx, e.target.value)
                                                }
                                                placeholder="e.g. Alpha Company"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => removeDeployedForce(idx)}
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
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Optional notes"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Training-specific fields */}
                        {isTraining && (
                            <>
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
                                                        <SelectItem key={q.value} value={q.value}>
                                                            {q.label}
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
                                            <FormLabel>Trainer</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value ?? ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select trainer" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {trainers.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Event
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
