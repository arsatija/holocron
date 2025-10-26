"use client";

import { useState, useTransition, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Clock } from "lucide-react";

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
import { CampaignEvent } from "@/db/schema";
import { getTroopersAsOptions } from "@/services/troopers";

const editEventSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Event name is required").max(255, "Name too long"),
    description: z.string().optional(),
    eventDate: z.date({
        required_error: "Event date is required",
    }),
    eventTime: z.string().optional(),
    eventType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint"]),
    zeusId: z.string().uuid().optional(),
    coZeusIds: z.array(z.string().uuid()).optional(),
    eventNotes: z.string().optional(),
    trooperIds: z.array(z.string().uuid()).default([]),
});

type EditEventFormData = z.infer<typeof editEventSchema>;

interface EditEventDialogProps {
    event: CampaignEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEventUpdated: () => void;
}

export default function EditEventDialog({
    event,
    open,
    onOpenChange,
    onEventUpdated,
}: EditEventDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [trooperOptions, setTrooperOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);

    const form = useForm<EditEventFormData>({
        resolver: zodResolver(editEventSchema),
        defaultValues: {
            id: "",
            name: "",
            description: "",
            eventDate: new Date(),
            eventTime: "",
            eventType: "Main",
            eventNotes: "",
            trooperIds: [],
        },
    });

    useEffect(() => {
        const fetchTroopers = async () => {
            try {
                const options = await getTroopersAsOptions();
                setTrooperOptions(options);
            } catch (error) {
                console.error("Error fetching troopers:", error);
            }
        };
        fetchTroopers();
    }, []);

    useEffect(() => {
        if (event) {
            form.reset({
                id: event.id,
                name: event.name,
                description: event.description || "",
                eventDate: new Date(event.eventDate),
                eventTime: event.eventTime || "",
                eventType: event.eventType as
                    | "Main"
                    | "Skirmish"
                    | "Fun"
                    | "Raid"
                    | "Joint",
                zeusId: event.zeusId || "",
                coZeusIds: event.coZeusIds || [],
                eventNotes: event.eventNotes || "",
                trooperIds: [], // We'll need to fetch this separately
            });
        }
    }, [event, form]);

    const onSubmit = (data: EditEventFormData) => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/v1/campaign-events", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...data,
                        eventDate: data.eventDate.toISOString().split("T")[0],
                    }),
                });

                if (response.ok) {
                    toast.success("Event updated successfully");
                    onEventUpdated();
                } else {
                    const error = await response.json();
                    toast.error(error.error || "Failed to update event");
                }
            } catch (error) {
                console.error("Error updating event:", error);
                toast.error("Failed to update event");
            }
        });
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                    <DialogDescription>
                        Update the event details.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter event name"
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter event description"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="eventDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Event Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "PPP"
                                                            )
                                                        ) : (
                                                            <span>
                                                                Pick a date
                                                            </span>
                                                        )}
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
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date <
                                                        new Date("1900-01-01")
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
                                        <FormLabel>Event Time</FormLabel>
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
                                        <FormDescription>
                                            Format: HH:MM (24-hour)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="eventType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select event type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Main">
                                                Main
                                            </SelectItem>
                                            <SelectItem value="Skirmish">
                                                Skirmish
                                            </SelectItem>
                                            <SelectItem value="Fun">
                                                Fun
                                            </SelectItem>
                                            <SelectItem value="Raid">
                                                Raid
                                            </SelectItem>
                                            <SelectItem value="Joint">
                                                Joint
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="eventNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter event notes"
                                            className="resize-none"
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
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Event
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
