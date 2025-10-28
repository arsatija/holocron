"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Users, Crown, Check, ChevronsUpDown } from "lucide-react";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
    MultiSelector,
    MultiSelectorContent,
    MultiSelectorInput,
    MultiSelectorItem,
    MultiSelectorList,
    MultiSelectorTrigger,
} from "@/components/ui/multi-select2";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CampaignEvent } from "@/db/schema";
import { getTroopersAsOptions } from "@/services/troopers";

interface ManageAttendanceDialogProps {
    event: CampaignEvent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAttendanceUpdated: () => void;
}

const attendanceSchema = z.object({
    zeusId: z.string().optional(),
    coZeusIds: z.array(z.string()).default([]),
    trooperIds: z.array(z.string()).default([]),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

export default function ManageAttendanceDialog({
    event,
    open,
    onOpenChange,
    onAttendanceUpdated,
}: ManageAttendanceDialogProps) {
    const [isPending, setIsPending] = useState(false);
    const [trooperOptions, setTrooperOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [zeusPopoverOpen, setZeusPopoverOpen] = useState(false);
    const [currentAttendanceData, setCurrentAttendanceData] = useState<any>(null);

    const form = useForm<AttendanceFormData>({
        resolver: zodResolver(attendanceSchema),
        defaultValues: {
            zeusId: event.zeusId || "NONE",
            coZeusIds: [],
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
        const fetchAttendanceData = async () => {
            if (event && open && event.id) {
                try {
                    const response = await fetch(`/api/v1/campaign-events/${event.id}/attendance`);
                    if (response.ok) {
                        const attendanceData = await response.json();
                        setCurrentAttendanceData(attendanceData);
                        
                        // Extract trooper IDs from attendance data
                        const allTrooperIds = attendanceData.map((att: any) => att.trooperId);
                        
                        // Get zeus and co-zeus from event fields
                        const zeusId = event.zeusId || "";
                        const coZeusIds = event.coZeusIds || [];
                        
                        // Filter out zeus and co-zeus from attendee IDs
                        const attendeeIds = allTrooperIds.filter(
                            (id: string) => id !== zeusId && !coZeusIds.includes(id)
                        );

                        form.reset({
                            zeusId: zeusId || "NONE",
                            coZeusIds,
                            trooperIds: attendeeIds,
                        });
                    }
                } catch (error) {
                    console.error("Error fetching attendance data:", error);
                }
            }
        };
        
        fetchAttendanceData();
    }, [event, open, form]);

    const onSubmit = (data: AttendanceFormData) => {
        setIsPending(true);
        fetch(`/api/v1/campaign-events`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: event.id,
                name: event.name,
                description: event.description,
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                eventType: event.eventType,
                zeusId: data.zeusId === "NONE" || !data.zeusId ? null : data.zeusId,
                coZeusIds: data.coZeusIds,
                eventNotes: event.eventNotes,
                trooperIds: data.trooperIds,
            }),
        })
            .then(async (response) => {
                if (response.ok) {
                    toast.success("Attendance updated successfully");
                    onAttendanceUpdated();
                    onOpenChange(false);
                } else {
                    const error = await response.json();
                    toast.error(error.error || "Failed to update attendance");
                }
            })
            .catch((error) => {
                console.error("Error updating attendance:", error);
                toast.error("Failed to update attendance");
            })
            .finally(() => setIsPending(false));
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Manage Attendance
                    </DialogTitle>
                    <DialogDescription>
                        Assign Zeus, Co-Zeus, and attendees for this event
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Zeus Selection */}
                        <FormField
                            control={form.control}
                            name="zeusId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zeus</FormLabel>
                                    <Popover open={zeusPopoverOpen} onOpenChange={setZeusPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    type="button"
                                                    className={cn(
                                                        "w-[300px] justify-between",
                                                        (!field.value || field.value === "NONE") && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value && field.value !== "NONE"
                                                        ? trooperOptions.find(
                                                              (trooper) =>
                                                                  trooper.value ===
                                                                  field.value
                                                          )?.label
                                                        : "Select Zeus"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search Zeus..."
                                                    className="h-9"
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        No Zeus found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="NONE"
                                                            onSelect={() => {
                                                                field.onChange(undefined);
                                                                setZeusPopoverOpen(false);
                                                            }}
                                                        >
                                                            None
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    (!field.value || field.value === "NONE")
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                        {trooperOptions.map(
                                                            (trooper) => (
                                                                <CommandItem
                                                                    value={
                                                                        trooper.label
                                                                    }
                                                                    key={
                                                                        trooper.value
                                                                    }
                                                                    onSelect={() => {
                                                                        field.onChange(
                                                                            trooper.value
                                                                        );
                                                                        setZeusPopoverOpen(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    {
                                                                        trooper.label
                                                                    }
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto",
                                                                            trooper.value ===
                                                                                field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            )
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Co-Zeus Selection */}
                        <FormField
                            control={form.control}
                            name="coZeusIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Co-Zeus</FormLabel>
                                    <FormControl>
                                        <MultiSelector
                                            values={field.value || []}
                                            onValuesChange={field.onChange}
                                            loop
                                            className="max-w-xs"
                                            options={trooperOptions.filter(
                                                (trooper) =>
                                                    form.watch("zeusId") !==
                                                    trooper.value
                                            )}
                                        >
                                            <MultiSelectorTrigger>
                                                <MultiSelectorInput placeholder="Add Co-Zeus" />
                                            </MultiSelectorTrigger>
                                            <MultiSelectorContent>
                                                <MultiSelectorList>
                                                    {trooperOptions
                                                        .filter(
                                                            (trooper) =>
                                                                form.watch(
                                                                    "zeusId"
                                                                ) !==
                                                                    trooper.value
                                                        )
                                                        .map((trooper) => (
                                                            <MultiSelectorItem
                                                                value={
                                                                    trooper.value
                                                                }
                                                                key={
                                                                    trooper.value
                                                                }
                                                            >
                                                                {trooper.label}
                                                            </MultiSelectorItem>
                                                        ))}
                                                </MultiSelectorList>
                                            </MultiSelectorContent>
                                        </MultiSelector>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Attendees Selection */}
                        <FormField
                            control={form.control}
                            name="trooperIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attendees</FormLabel>
                                    <FormControl>
                                        <MultiSelector
                                            values={field.value || []}
                                            onValuesChange={field.onChange}
                                            loop
                                            className="max-w-xs"
                                            options={trooperOptions.filter(
                                                (trooper) =>
                                                    form.watch("zeusId") !==
                                                    trooper.value &&
                                                    !form
                                                        .watch("coZeusIds")
                                                        ?.includes(trooper.value)
                                            )}
                                        >
                                            <MultiSelectorTrigger>
                                                <MultiSelectorInput placeholder="Add Attendees" />
                                            </MultiSelectorTrigger>
                                            <MultiSelectorContent>
                                                <MultiSelectorList>
                                                    {trooperOptions
                                                        .filter(
                                                            (trooper) =>
                                                                form.watch(
                                                                    "zeusId"
                                                                ) !==
                                                                    trooper.value &&
                                                                !form
                                                                    .watch(
                                                                        "coZeusIds"
                                                                    )
                                                                    ?.includes(
                                                                        trooper.value
                                                                    )
                                                        )
                                                        .map((trooper) => (
                                                            <MultiSelectorItem
                                                                value={
                                                                    trooper.value
                                                                }
                                                                key={
                                                                    trooper.value
                                                                }
                                                            >
                                                                {trooper.label}
                                                            </MultiSelectorItem>
                                                        ))}
                                                </MultiSelectorList>
                                            </MultiSelectorContent>
                                        </MultiSelector>
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
                                Update Attendance
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

