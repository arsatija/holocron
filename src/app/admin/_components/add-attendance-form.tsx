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

import { createAttendanceAction } from "@/app/admin/_lib/actions";
import { getErrorMessage } from "@/lib/handle-error";
import { toast } from "sonner";
import { formSchema } from "@/app/admin/_lib/schema";

export default function AddAttendanceForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const [isMainZeusPopoverOpen, setIsMainZeusPopoverOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [troopers, setTroopers] = useState<
        { value: string; label: string }[]
    >([]);
    const [troopersLoading, setTroopersLoading] = useState(true);

    const [isSubmitPending, startSubmitTransition] = useTransition();

    useEffect(() => {
        fetch("/api/v1/troopersList")
            .then((response) => response.json())
            .then((data) => {
                setTroopers(data);
                setTroopersLoading(false);
            })
            .catch((error) => console.error("Error loading troopers:", error));

        form.setValue("eventDate", new Date());
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
            const { id, error } = await createAttendanceAction(
                attendanceSubmissionValues
            );

            if (error) {
                toast.error(getErrorMessage(error));
                return;
            }

            toast.success(`Attendance ${id} created`);
            form.reset();
        });
    }

    const handleContinueClick = () => {
        // Close the dialog regardless of validation
        form.handleSubmit(handleSubmit)();

        setIsDialogOpen(false);
    };

    return (
        <div className="border-zinc-200 dark:border-zinc-800 shadow-md mt-4 rounded-xl border p-4">
            <h2 className="text-2xl font-extrabold mb-4">
                Operation Attendance Form
            </h2>
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
                                    onOpenChange={setIsMainZeusPopoverOpen}
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
                                                    ? troopers.find(
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
                                        {troopersLoading ? (
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
                                                        No troopers found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {troopers.map(
                                                            (trooper) => (
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
                                    This is the name of the trooper who main
                                    zeused the operation.
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
                                    options={troopers}
                                >
                                    <MultiSelectorTrigger>
                                        <MultiSelectorInput placeholder="Select Co-Zeuses" />
                                    </MultiSelectorTrigger>
                                    <MultiSelectorContent>
                                        <MultiSelectorList>
                                            {troopers.map((trooper) => (
                                                <MultiSelectorItem
                                                    value={trooper.value}
                                                    key={trooper.value}
                                                >
                                                    {trooper.label}
                                                </MultiSelectorItem>
                                            ))}
                                        </MultiSelectorList>
                                    </MultiSelectorContent>
                                </MultiSelector>
                                <FormDescription>
                                    This is the list of zeuses who helped zeus
                                    the operation. If none were present, leave
                                    this blank.
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
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
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
                                                date < new Date("2024-12-16")
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
                        name="eventName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Operation Details</FormLabel>
                                <FormControl>
                                    <Input placeholder="Skirmish" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Enter the type of operation.
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
                                    className="max-w-xs"
                                    options={troopers}
                                >
                                    <MultiSelectorTrigger>
                                        <MultiSelectorInput placeholder="Select Attendees" />
                                    </MultiSelectorTrigger>
                                    <MultiSelectorContent>
                                        <MultiSelectorList>
                                            {troopers.map((trooper) => (
                                                <MultiSelectorItem
                                                    value={trooper.value}
                                                    key={trooper.value}
                                                >
                                                    {trooper.label}
                                                </MultiSelectorItem>
                                            ))}
                                        </MultiSelectorList>
                                    </MultiSelectorContent>
                                </MultiSelector>
                                <FormDescription>
                                    This is the list of troopers who attended
                                    the operation.
                                </FormDescription>
                            </FormItem>
                        )}
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Submit</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Is all of the information correct?
                                </DialogTitle>
                                <DialogDescription className="pt-2">
                                    Please double check the information you have
                                    entered as this will immediately affect the
                                    unit records.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
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
        </div>
    );
}
