"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
    Plus,
    Trash2,
    ChevronsUpDown,
    Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TiptapEditor from "@/components/tiptap/editor";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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

interface TrooperOption {
    id: string;
    name: string;
    numbers: number;
    rank: number;
}

interface CreateBriefDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventId: string;
    seriesOperationType?: string | null;
    /** Existing brief data for edit mode — null means create mode */
    existing?: {
        operationType: string;
        operationName: string | null;
        transmittedById: string | null;
        deployedForces: string[] | null;
        objectives: Array<{ title: string; description: string }> | null;
        situationReport: string | null;
        eventNotes: string | null;
    } | null;
    troopers: TrooperOption[];
    onSaved: () => void;
}

const FULL_BRIEF_TYPES = ["Main", "Raid", "Joint"] as const;

const briefSchema = z.object({
    operationType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint"]),
    operationName: z.string().optional(),
    transmittedById: z.string().optional(),
    deployedForces: z.array(z.string()).default([]),
    objectives: z
        .array(
            z.object({
                title: z.string().min(1, "Title required"),
                description: z.string().default(""),
                type: z.enum(["primary", "secondary"]).default("primary"),
            })
        )
        .default([]),
    situationReport: z.string().optional(),
    eventNotes: z.string().optional(),
});

type BriefValues = z.infer<typeof briefSchema>;

function TrooperCombobox({
    value,
    onChange,
    troopers,
}: {
    value: string | undefined;
    onChange: (val: string | undefined) => void;
    troopers: TrooperOption[];
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
                    {selected ? `${selected.numbers} ${selected.name}` : "Select Zeus..."}
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

export default function CreateBriefDialog({
    open,
    onOpenChange,
    eventId,
    seriesOperationType,
    existing,
    troopers,
    onSaved,
}: CreateBriefDialogProps) {
    const [isPending, startTransition] = useTransition();
    const isEditMode = !!existing;

    const defaultOpType =
        (seriesOperationType as BriefValues["operationType"]) ?? "Main";

    const form = useForm<BriefValues>({
        resolver: zodResolver(briefSchema),
        defaultValues: {
            operationType: defaultOpType,
            operationName: "",
            transmittedById: "",
            deployedForces: [],
            objectives: [],
            situationReport: "",
            eventNotes: "",
        },
    });

    // Populate form when editing
    useEffect(() => {
        if (open && existing) {
            form.reset({
                operationType:
                    (existing.operationType as BriefValues["operationType"]) ??
                    "Main",
                operationName: existing.operationName ?? "",
                transmittedById: existing.transmittedById ?? "",
                deployedForces: existing.deployedForces ?? [],
                objectives: existing.objectives ?? [],
                situationReport: existing.situationReport ?? "",
                eventNotes: existing.eventNotes ?? "",
            });
        } else if (open && !existing) {
            form.reset({
                operationType: defaultOpType,
                operationName: "",
                transmittedById: "",
                deployedForces: [],
                objectives: [],
                situationReport: "",
                eventNotes: "",
            });
        }
    }, [open, existing]);

    const watchedType = form.watch("operationType");
    const isFullBrief = (FULL_BRIEF_TYPES as readonly string[]).includes(watchedType);

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

    const onSubmit = (data: BriefValues) => {
        startTransition(async () => {
            try {
                const payload = {
                    operationType: data.operationType,
                    operationName: data.operationName || null,
                    transmittedById: data.transmittedById || null,
                    deployedForces: data.deployedForces.filter(Boolean),
                    objectives:
                        data.objectives.length > 0 ? data.objectives : null,
                    situationReport: data.situationReport || null,
                    eventNotes: data.eventNotes || null,
                };

                const url = `/api/v1/events/${eventId}/brief`;
                const method = isEditMode ? "PUT" : "POST";

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error ?? "Failed to save brief");
                    return;
                }

                toast.success(
                    isEditMode ? "Brief updated" : "Brief created"
                );
                onOpenChange(false);
                onSaved();
            } catch {
                toast.error("Failed to save brief");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? "Edit Operation Brief" : "Create Operation Brief"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Operation Type */}
                        <FormField
                            control={form.control}
                            name="operationType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Operation Type *</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Main">Main Operation</SelectItem>
                                            <SelectItem value="Skirmish">Skirmish</SelectItem>
                                            <SelectItem value="Fun">Fun Op</SelectItem>
                                            <SelectItem value="Raid">Raid</SelectItem>
                                            <SelectItem value="Joint">Joint Op</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Operation Name */}
                        <FormField
                            control={form.control}
                            name="operationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Operation Name{isFullBrief ? " *" : " (optional)"}
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

                        {/* Zeus */}
                        <FormField
                            control={form.control}
                            name="transmittedById"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Zeus{isFullBrief ? " *" : " (optional)"}
                                    </FormLabel>
                                    <FormControl>
                                        <TrooperCombobox
                                            value={field.value || undefined}
                                            onChange={(val) =>
                                                field.onChange(val ?? "")
                                            }
                                            troopers={troopers}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* SITREP */}
                        <FormField
                            control={form.control}
                            name="situationReport"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Situation Report{isFullBrief ? " *" : " (optional)"}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="rounded-md overflow-hidden border border-input [&_.ProseMirror]:max-w-none [&_.ProseMirror]:mx-0 [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3">
                                            <TiptapEditor
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Objectives */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    Objectives{isFullBrief ? " *" : " (optional)"}
                                </p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        appendObjective({ title: "", description: "", type: "primary" })
                                    }
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add
                                </Button>
                            </div>
                            {objectiveFields.map((field, idx) => (
                                <div
                                    key={field.id}
                                    className="flex gap-2 items-start border border-border rounded-md p-3"
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`objectives.${idx}.title`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                placeholder={`Objective ${idx + 1} title`}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`objectives.${idx}.type`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={field.value === "primary" ? "default" : "outline"}
                                                                className="shrink-0 text-xs h-9"
                                                                onClick={() =>
                                                                    field.onChange(
                                                                        field.value === "primary" ? "secondary" : "primary"
                                                                    )
                                                                }
                                                            >
                                                                {field.value === "primary" ? "Primary" : "Secondary"}
                                                            </Button>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`objectives.${idx}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Details (optional)"
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
                                        className="shrink-0"
                                        onClick={() => removeObjective(idx)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Deployed Forces */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Deployed Forces (optional)</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => appendForce("" as never)}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add
                                </Button>
                            </div>
                            {forceFields.map((field, idx) => (
                                <div key={field.id} className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`deployedForces.${idx}` as never}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        placeholder={`Unit or element ${idx + 1}`}
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
                                        onClick={() => removeForce(idx)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Event Notes */}
                        <FormField
                            control={form.control}
                            name="eventNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Notes (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional notes..."
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? "Saving..."
                                    : isEditMode
                                    ? "Update Brief"
                                    : "Create Brief"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
