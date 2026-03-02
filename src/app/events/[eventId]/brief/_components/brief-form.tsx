"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TiptapEditor from "@/components/tiptap/editor";
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
    label: string;
    value: string;
}

interface UnitElementOption {
    id: string;
    name: string;
}

export interface BriefFormProps {
    eventId: string;
    troopers: TrooperOption[];
    seriesOperationType?: string | null;
    existing?: {
        operationType: string;
        operationName: string | null;
        transmittedById: string | null;
        deployedForces: Array<{ name: string; optional: boolean }> | null;
        objectives: Array<{ title: string; description: string }> | null;
        situationReport: string | null;
        eventNotes: string | null;
    } | null;
}

const FULL_BRIEF_TYPES = ["Main", "Raid", "Joint"] as const;

const briefSchema = z.object({
    operationType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint"]),
    operationName: z.string().optional(),
    transmittedById: z.string().optional(),
    deployedForces: z.array(z.object({
        name: z.string().min(1, "Name required"),
        optional: z.boolean().default(false),
    })).default([]),
    objectives: z
        .array(z.object({
            title: z.string().min(1, "Title required"),
            description: z.string().default(""),
            type: z.enum(["primary", "secondary"]).default("primary"),
        }))
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
    const selected = troopers.find((t) => t.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                >
                    {selected ? selected.label : "Select Zeus..."}
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
                                    key="__clear__"
                                    value="__clear__"
                                    onSelect={() => {
                                        onChange(undefined);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="text-muted-foreground italic">Clear selection</span>
                                </CommandItem>
                            )}
                            {troopers.map((t) => (
                                <CommandItem
                                    key={t.value}
                                    value={t.label}
                                    onSelect={() => {
                                        onChange(t.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === t.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {t.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function ForceCombobox({
    value,
    onChange,
    unitElements,
}: {
    value: string;
    onChange: (val: string) => void;
    unitElements: UnitElementOption[];
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = unitElements.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
    );
    const exactMatch = unitElements.some(
        (e) => e.name.toLowerCase() === search.trim().toLowerCase()
    );
    const showCustom = search.trim().length > 0 && !exactMatch;

    return (
        <Popover
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o) setSearch("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                >
                    {value || <span className="text-muted-foreground">Select unit element...</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search or type custom name..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {search.trim() ? null : "No unit elements found."}
                        </CommandEmpty>
                        {showCustom && (
                            <CommandGroup heading="Custom">
                                <CommandItem
                                    value={`__custom__${search}`}
                                    onSelect={() => {
                                        onChange(search.trim());
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Use &ldquo;{search.trim()}&rdquo;
                                </CommandItem>
                            </CommandGroup>
                        )}
                        <CommandGroup heading="Unit Elements">
                            {filtered.map((e) => (
                                <CommandItem
                                    key={e.id}
                                    value={e.name}
                                    onSelect={() => {
                                        onChange(e.name);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === e.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {e.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function BriefForm({ eventId, troopers, seriesOperationType, existing }: BriefFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [unitElements, setUnitElements] = useState<UnitElementOption[]>([]);
    const isEditMode = !!existing;

    useEffect(() => {
        fetch("/api/v1/unit-elements")
            .then((r) => r.json())
            .then(setUnitElements)
            .catch(() => {/* non-critical */});
    }, []);

    const defaultOpType = (
        existing?.operationType ??
        seriesOperationType ??
        "Main"
    ) as BriefValues["operationType"];

    const form = useForm<BriefValues>({
        resolver: zodResolver(briefSchema),
        defaultValues: {
            operationType: defaultOpType,
            operationName: existing?.operationName ?? "",
            transmittedById: existing?.transmittedById ?? "",
            deployedForces: existing?.deployedForces ?? [],
            objectives: existing?.objectives ?? [],
            situationReport: existing?.situationReport ?? "",
            eventNotes: existing?.eventNotes ?? "",
        },
    });

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
    } = useFieldArray({ control: form.control, name: "deployedForces" });

    const onSubmit = (data: BriefValues) => {
        startTransition(async () => {
            try {
                const payload = {
                    operationType: data.operationType,
                    operationName: data.operationName || null,
                    transmittedById: data.transmittedById || null,
                    deployedForces: data.deployedForces.filter((f) => f.name.trim()),
                    objectives: data.objectives.length > 0 ? data.objectives : null,
                    situationReport: data.situationReport || null,
                    eventNotes: data.eventNotes || null,
                };

                const res = await fetch(`/api/v1/events/${eventId}/brief`, {
                    method: isEditMode ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error ?? "Failed to save brief");
                    return;
                }

                toast.success(isEditMode ? "Brief updated" : "Brief created");
                router.push(`/events/${eventId}/brief`);
            } catch {
                toast.error("Failed to save brief");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Operation Type */}
                <FormField
                    control={form.control}
                    name="operationType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Operation Type *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
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
                            <FormLabel>Zeus{isFullBrief ? " *" : " (optional)"}</FormLabel>
                            <FormControl>
                                <TrooperCombobox
                                    value={field.value || undefined}
                                    onChange={(val) => field.onChange(val ?? "")}
                                    troopers={troopers}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Situation Report */}
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
                            onClick={() => appendObjective({ title: "", description: "", type: "primary" })}
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
                                                    <Input placeholder={`Objective ${idx + 1} title`} {...field} />
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
                                                <Input placeholder="Details (optional)" {...field} />
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
                            onClick={() => appendForce({ name: "", optional: false })}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add
                        </Button>
                    </div>
                    {forceFields.map((field, idx) => (
                        <div key={field.id} className="flex gap-2 items-center">
                            <FormField
                                control={form.control}
                                name={`deployedForces.${idx}.name`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <ForceCombobox
                                                value={field.value}
                                                onChange={field.onChange}
                                                unitElements={unitElements}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`deployedForces.${idx}.optional`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={field.value ? "outline" : "ghost"}
                                                className="shrink-0 text-xs h-9 w-24"
                                                onClick={() => field.onChange(!field.value)}
                                            >
                                                {field.value ? "Optional" : "Required"}
                                            </Button>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="shrink-0"
                                onClick={() => removeForce(idx)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Command Notes */}
                <FormField
                    control={form.control}
                    name="eventNotes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Command Notes (optional)</FormLabel>
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

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEditMode ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            isEditMode ? "Update Brief" : "Create Brief"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
