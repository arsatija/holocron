"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useEffect, useState, useTransition } from "react";

import { MultiSelect } from "@/components/ui/multi-select";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

import {
    MultiSelector,
    MultiSelectorContent,
    MultiSelectorInput,
    MultiSelectorItem,
    MultiSelectorList,
    MultiSelectorTrigger,
} from "@/components/ui/multi-select2";

import {
    createOperationAction,
    refresh,
    updateOperationAction,
} from "@/app/admin/_lib/actions";
import { getErrorMessage } from "@/lib/handle-error";
import { toast } from "sonner";
import { formSchema } from "@/app/admin/_lib/schema";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectItem,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { selectEventTypesSchema } from "@/db/schema";
import { OperationEntry } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { revalidateTag } from "next/cache";

export default function OperationForm(props: {
    dialogCallback: (open: boolean) => void;
    editOperation?: OperationEntry;
}) {
    const { dialogCallback, editOperation } = props;
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: editOperation?.id ?? undefined,
            eventDate: editOperation?.eventDate
                ? new Date(editOperation.eventDate)
                : new Date(),
            eventType: editOperation?.eventType ?? undefined,
            trooperIds:
                editOperation?.attendees.map((attendee) => attendee.id) ?? [],
            zeusId: editOperation?.zeus?.id ?? "",
            coZeusIds: editOperation?.cozeus.map((cozeus) => cozeus.id) ?? [],
            eventNotes: editOperation?.eventNotes ?? "",
        },
    });

    const mode = editOperation ? "Edit" : "Creat";

    const [isMainZeusPopoverOpen, setIsMainZeusPopoverOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [troopers, setTroopers] = useState<
        { value: string; label: string }[]
    >([]);
    const [zeusTroopers, setZeusTroopers] = useState<
        { value: string; label: string }[]
    >([]);
    const [troopersLoading, setTroopersLoading] = useState(true);
    const [zeusTroopersLoading, setZeusTroopersLoading] = useState(true);

    const [isSubmitPending, startSubmitTransition] = useTransition();

    useEffect(() => {
        fetch("/api/v1/troopersList")
            .then((response) => response.json())
            .then((data) => {
                setTroopers(data);
                setTroopersLoading(false);
            })
            .catch((error) => console.error("Error loading troopers:", error));

        fetch("/api/v1/zeusList")
            .then((response) => response.json())
            .then((data) => {
                setZeusTroopers(data);
                setZeusTroopersLoading(false);
            })
            .catch((error) => console.error("Error loading zeuses:", error));
    }, []);

    function handleSubmit(values: z.infer<typeof formSchema>) {
        startSubmitTransition(async () => {
            const attendanceSubmissionValues = formSchema.parse(values);
            // Get all zeus IDs into a single array
            const allZeusIds = [
                attendanceSubmissionValues.zeusId,
                ...(attendanceSubmissionValues.coZeusIds || []),
            ];

            // Add any zeus IDs that aren't already in trooperIds
            allZeusIds.forEach((zeusId) => {
                if (!attendanceSubmissionValues.trooperIds.includes(zeusId)) {
                    attendanceSubmissionValues.trooperIds.push(zeusId);
                }
            });

            const { id, error } =
                mode === "Edit"
                    ? await updateOperationAction(attendanceSubmissionValues)
                    : await createOperationAction(attendanceSubmissionValues);

            if (error) {
                toast.error(getErrorMessage(error));
                return;
            }

            refresh();
            toast.success(`Operation ${id} ${mode}ed`);
            form.reset();
        });
        dialogCallback(false);
    }

    const handleContinueClick = () => {
        // Close the dialog regardless of validation
        form.handleSubmit(handleSubmit)();

        setIsDialogOpen(false);
    };

    return (
        <div className="max-h-[80vh]">
            {troopersLoading || zeusTroopersLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="size-4 animate-spin" color="#993534" />
                </div>
            ) : (
                <ScrollArea className="h-[80vh]">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="zeusId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Main Zeus's Name</FormLabel>
                                        <Popover
                                            open={isMainZeusPopoverOpen}
                                            onOpenChange={
                                                setIsMainZeusPopoverOpen
                                            }
                                            modal={true}
                                        >
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        type="button"
                                                        className={cn(
                                                            "w-[200px] justify-between",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? zeusTroopers.find(
                                                                  (trooper) =>
                                                                      trooper.value ===
                                                                      field.value
                                                              )?.label
                                                            : "Select Main Zeus"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                {zeusTroopersLoading ? (
                                                    <Loader2
                                                        className="size-4 animate-spin"
                                                        color="#993534"
                                                    />
                                                ) : (
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search Main Zeus..."
                                                            className="h-9"
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No troopers
                                                                found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {zeusTroopers.map(
                                                                    (
                                                                        trooper
                                                                    ) => (
                                                                        <CommandItem
                                                                            value={
                                                                                trooper.label
                                                                            }
                                                                            key={
                                                                                trooper.value
                                                                            }
                                                                            onSelect={() => {
                                                                                form.setValue(
                                                                                    "zeusId",
                                                                                    trooper.value
                                                                                );
                                                                                setIsMainZeusPopoverOpen(
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
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            This is the name of the trooper who
                                            main zeused the operation.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="coZeusIds"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Co Zeuses</FormLabel>
                                        <MultiSelector
                                            key="coZeusSelector"
                                            values={field.value || []}
                                            onValuesChange={field.onChange}
                                            loop
                                            className="max-w-xs"
                                            options={zeusTroopers}
                                        >
                                            <MultiSelectorTrigger>
                                                <MultiSelectorInput placeholder="Select Co-Zeuses" />
                                            </MultiSelectorTrigger>
                                            <MultiSelectorContent>
                                                <MultiSelectorList>
                                                    {zeusTroopers.map(
                                                        (trooper) => (
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
                                                        )
                                                    )}
                                                </MultiSelectorList>
                                            </MultiSelectorContent>
                                        </MultiSelector>
                                        <FormDescription>
                                            This is the list of zeuses who
                                            helped zeus the operation. If none
                                            were present, leave this blank.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="eventDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Operation Date</FormLabel>
                                        <Popover modal={true}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[240px] pl-3 text-left font-normal",
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
                                                        date > new Date() ||
                                                        date <
                                                            new Date(
                                                                "2024-12-16"
                                                            )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            The date the operation was hosted.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="eventType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operation Type</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select the operation type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {selectEventTypesSchema.options.map(
                                                        (eventType) => (
                                                            <SelectItem
                                                                key={eventType}
                                                                value={
                                                                    eventType
                                                                }
                                                            >
                                                                {eventType}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormDescription>
                                            Select the type of operation.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="trooperIds"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Attendees</FormLabel>
                                        <MultiSelector
                                            key="trooperSelector"
                                            values={field.value || []}
                                            onValuesChange={field.onChange}
                                            loop
                                            className="max-w-full"
                                            options={troopers}
                                        >
                                            <MultiSelectorTrigger>
                                                <MultiSelectorInput placeholder="Select Attendees" />
                                            </MultiSelectorTrigger>
                                            <MultiSelectorContent>
                                                <MultiSelectorList>
                                                    {troopers.map((trooper) => (
                                                        <MultiSelectorItem
                                                            value={
                                                                trooper.value
                                                            }
                                                            key={trooper.value}
                                                        >
                                                            {trooper.label}
                                                        </MultiSelectorItem>
                                                    ))}
                                                </MultiSelectorList>
                                            </MultiSelectorContent>
                                        </MultiSelector>
                                        <FormDescription>
                                            This is the list of troopers who
                                            attended the operation.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="eventNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operation Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Feel free to add any notes about the operation here."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            You can mention the name of the
                                            operation, who the joint op was with
                                            etc.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Dialog
                                open={isDialogOpen}
                                onOpenChange={setIsDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>Submit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Is all of the information correct?
                                        </DialogTitle>
                                        <DialogDescription className="pt-2">
                                            Please double check the information
                                            you have entered as this will
                                            immediately affect the unit records.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button
                                                onClick={handleContinueClick}
                                                disabled={isSubmitPending}
                                            >
                                                {isSubmitPending && (
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                )}
                                                Continue
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </form>
                    </Form>
                </ScrollArea>
            )}
        </div>
    );
}
