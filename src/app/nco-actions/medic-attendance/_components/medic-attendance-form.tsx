"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    createMedicAttendanceAction,
    getMedicOptionsAction,
    getMedicElementOptionsAction,
    getOperationEventOptionsAction,
} from "../_lib/actions";
import {
    medicAttendanceFormSchema,
    MedicAttendanceFormValues,
} from "../_lib/schema";

type Option = { value: string; label: string };
type EventOption = Option & { operationType: string | null };

interface MedicAttendanceFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function MedicAttendanceForm({
    open,
    onOpenChange,
    onSuccess,
}: MedicAttendanceFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isFetching, setIsFetching] = useState(true);
    const [medicOptions, setMedicOptions] = useState<Option[]>([]);
    const [elementOptions, setElementOptions] = useState<Option[]>([]);
    const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
    const [medicPopoverOpen, setMedicPopoverOpen] = useState(false);
    const [eventPopoverOpen, setEventPopoverOpen] = useState(false);

    const form = useForm<MedicAttendanceFormValues>({
        resolver: zodResolver(medicAttendanceFormSchema),
        defaultValues: {
            medicId: "",
            elementId: "",
            operationType: "Main",
            eventId: "",
        },
    });

    const selectedEventId = form.watch("eventId");
    const selectedEvent = eventOptions.find((e) => e.value === selectedEventId);

    useEffect(() => {
        if (!open) return;
        setIsFetching(true);
        Promise.all([
            getMedicOptionsAction(),
            getMedicElementOptionsAction(),
            getOperationEventOptionsAction(),
        ])
            .then(([medics, elements, ops]) => {
                setMedicOptions(medics);
                setElementOptions(elements);
                setEventOptions(ops);
            })
            .catch(() => toast.error("Failed to load form data"))
            .finally(() => setIsFetching(false));
    }, [open]);

    // Auto-fill operation type whenever the linked event changes.
    useEffect(() => {
        if (!selectedEvent) return;
        form.setValue("operationType", (selectedEvent.operationType ?? "Main") as MedicAttendanceFormValues["operationType"]);
    }, [selectedEvent, form]);

    function onSubmit(values: MedicAttendanceFormValues) {
        startTransition(async () => {
            const result = await createMedicAttendanceAction(values);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Medic attendance logged");
                onSuccess();
                onOpenChange(false);
                form.reset({
                    medicId: "",
                    elementId: "",
                    operationType: "Main",
                    eventId: "",
                });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Medic Attendance</DialogTitle>
                </DialogHeader>

                {isFetching ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            {/* Linked operation */}
                            <FormField
                                control={form.control}
                                name="eventId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Linked Operation</FormLabel>
                                        <Popover
                                            open={eventPopoverOpen}
                                            onOpenChange={setEventPopoverOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        type="button"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground",
                                                        )}
                                                    >
                                                        {field.value
                                                            ? eventOptions.find(
                                                                  (e) => e.value === field.value,
                                                              )?.label
                                                            : "Select an operation"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[350px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search operations..."
                                                        className="h-9"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No operations found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {eventOptions.map((e) => (
                                                                <CommandItem
                                                                    key={e.value}
                                                                    value={e.label}
                                                                    onSelect={() => {
                                                                        field.onChange(e.value);
                                                                        setEventPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    {e.label}
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto",
                                                                            e.value === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0",
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        {selectedEvent && (
                                            <p className="text-xs text-muted-foreground">
                                                Operation type:{" "}
                                                <span className="font-medium text-foreground">
                                                    {selectedEvent.operationType ?? "Main (default — not yet set on this operation)"}
                                                </span>
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Operation must meet attendance requirements for
                                            medic attendance to count.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Medic search */}
                            <FormField
                                control={form.control}
                                name="medicId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Medic</FormLabel>
                                        <Popover
                                            open={medicPopoverOpen}
                                            onOpenChange={setMedicPopoverOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        type="button"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground",
                                                        )}
                                                    >
                                                        {field.value
                                                            ? medicOptions.find(
                                                                  (m) => m.value === field.value,
                                                              )?.label
                                                            : "Select a medic"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[350px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search medics..."
                                                        className="h-9"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No billeted medics found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {medicOptions.map((m) => (
                                                                <CommandItem
                                                                    key={m.value}
                                                                    value={m.label}
                                                                    onSelect={() => {
                                                                        field.onChange(m.value);
                                                                        setMedicPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    {m.label}
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto",
                                                                            m.value === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0",
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Element */}
                            <FormField
                                control={form.control}
                                name="elementId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Element</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an element" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {elementOptions.map((el) => (
                                                    <SelectItem key={el.value} value={el.value}>
                                                        {el.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            If non main-op event, use MythHQ.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Log Attendance
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}