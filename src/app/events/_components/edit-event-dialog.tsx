"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils";
import { EventRow } from "./event-card";

interface TrooperOption {
    id: string;
    name: string;
    numbers: number;
    rank: number;
}

interface QualificationOption {
    id: string;
    name: string;
    abbreviation: string;
}

interface CampaignOption {
    id: string;
    name: string;
}

interface EditEventDialogProps {
    event: EventRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    troopers: TrooperOption[];
    qualifications: QualificationOption[];
    campaigns: CampaignOption[];
    onSaved: () => void;
}

const editSchema = z.object({
    name: z.string().optional(),
    eventDate: z.date({ required_error: "Date is required" }),
    eventTime: z.string().optional(),
    eventEndTime: z.string().optional(),
    campaignId: z.string().optional(),
    description: z.string().optional(),
    bannerImage: z.string().optional(),
    qualificationId: z.string().optional(),
    scheduledTrainerId: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

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
                    {selected ? `${selected.numbers} ${selected.name}` : "Select trainer..."}
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
                                    <span className="text-muted-foreground italic">Clear selection</span>
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

export default function EditEventDialog({
    event,
    open,
    onOpenChange,
    troopers,
    qualifications,
    campaigns,
    onSaved,
}: EditEventDialogProps) {
    const [isPending, startTransition] = useTransition();
    const isOperation = event.eventKind === "Operation";
    const isTraining = event.eventKind === "Training";

    const form = useForm<EditValues>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            name: event.name ?? "",
            eventDate: parseLocalDate(event.eventDate),
            eventTime: event.eventTime ?? "",
            eventEndTime: event.eventEndTime ?? "",
            campaignId: event.campaignId ?? "none",
            description: event.description ?? "",
            bannerImage: event.bannerImage ?? "",
            qualificationId: event.qualificationId ?? "none",
            scheduledTrainerId: event.scheduledTrainerId ?? "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: event.name ?? "",
                eventDate: parseLocalDate(event.eventDate),
                eventTime: event.eventTime ?? "",
                eventEndTime: event.eventEndTime ?? "",
                campaignId: event.campaignId ?? "none",
                description: event.description ?? "",
                bannerImage: event.bannerImage ?? "",
                qualificationId: event.qualificationId ?? "none",
                scheduledTrainerId: event.scheduledTrainerId ?? "",
            });
        }
    }, [open, event]);

    const onSubmit = (data: EditValues) => {
        startTransition(async () => {
            try {
                const payload: Record<string, unknown> = {
                    eventDate: format(data.eventDate, "yyyy-MM-dd"),
                    eventTime: data.eventTime || null,
                    eventEndTime: isTraining ? (data.eventEndTime || null) : null,
                    campaignId: data.campaignId === "none" ? null : data.campaignId || null,
                    description: data.description || null,
                    bannerImage: data.bannerImage || null,
                };

                if (!isOperation) {
                    payload.name = data.name || event.name;
                }
                if (isTraining) {
                    payload.qualificationId = data.qualificationId === "none" ? null : data.qualificationId || null;
                    payload.scheduledTrainerId = data.scheduledTrainerId || null;
                }

                const res = await fetch(`/api/v1/events/${event.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error ?? "Failed to update event");
                    return;
                }

                toast.success("Event updated");
                onOpenChange(false);
                onSaved();
            } catch {
                toast.error("Failed to update event");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name — shown for Training and Meeting/Social */}
                        {!isOperation && (
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Event Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Event name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="eventDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
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

                        {/* Time */}
                        <FormField
                            control={form.control}
                            name="eventTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isTraining ? "Start Time (EST, optional)" : "Time (EST, optional)"}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="HH:MM" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* End Time — Training only */}
                        {isTraining && (
                            <FormField
                                control={form.control}
                                name="eventEndTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Time (EST, optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="HH:MM" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Campaign */}
                        <FormField
                            control={form.control}
                            name="campaignId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Campaign (optional)</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Standalone" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Standalone</SelectItem>
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

                        {/* Training-specific: Qualification + Trainer */}
                        {isTraining && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="qualificationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Qualification (optional)</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select qualification" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
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
                                            <FormLabel>Trainer (optional)</FormLabel>
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
                            </>
                        )}

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Add event description..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Banner Image */}
                        <FormField
                            control={form.control}
                            name="bannerImage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Banner Image URL (optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
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
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
