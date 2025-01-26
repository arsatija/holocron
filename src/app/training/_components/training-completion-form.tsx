"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createTrainingAction } from "../_lib/actions";
import { getErrorMessage } from "@/lib/handle-error";
import { toast } from "sonner";
import {
    MultiSelector,
    MultiSelectorItem,
    MultiSelectorList,
    MultiSelectorContent,
    MultiSelectorInput,
    MultiSelectorTrigger,
} from "@/components/ui/multi-select2";

const formSchema = z.object({
    trainerId: z.string().min(1),
    qualificationId: z.string().min(1),
    traineeIds: z.array(z.string()).optional().default([]),
    trainingDate: z
        .date({
            required_error: "Training date is required.",
        })
        .default(new Date()),
    trainingNotes: z.string().optional(),
});

export default function TrainingCompletionForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            trainingDate: new Date(),
            trainingNotes: "",
        },
    });

    const [trainerPopoverOpen, setTrainerPopoverOpen] = useState(false);
    const [qualificationPopoverOpen, setQualificationPopoverOpen] =
        useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [troopersLoading, setTroopersLoading] = useState(true);
    const [qualificationsLoading, setQualificationsLoading] = useState(true);
    const [trainersLoading, setTrainersLoading] = useState(true);
    const [troopers, setTroopers] = useState<
        { label: string; value: string }[]
    >([]);
    const [trainers, setTrainers] = useState<
        { label: string; value: string }[]
    >([]);

    const [qualifications, setQualifications] = useState<
        {
            id: string;
            name: string;
            abbreviation: string;
        }[]
    >([]);

    const [isSubmitPending, startSubmitTransition] = useTransition();

    useEffect(() => {
        fetch("/api/v1/troopersList")
            .then((response) => response.json())
            .then((data) => {
                setTroopers(data);
                setTroopersLoading(false);
            })
            .catch((error) => console.error("Error loading troopers:", error));

        fetch("/api/v1/trainersList")
            .then((response) => response.json())
            .then((data) => {
                setTrainers(data);
                setTrainersLoading(false);
            })
            .catch((error) => console.error("Error loading trainers:", error));

        fetch("/api/v1/qualificationList")
            .then((response) => response.json())
            .then((data) => {
                setQualifications(data);
                setQualificationsLoading(false);
            })
            .catch((error) =>
                console.error("Error loading qualifications:", error)
            );
    }, []);

    function handleSubmit(values: z.infer<typeof formSchema>) {
        startSubmitTransition(async () => {
            const { id, error } = await createTrainingAction(values);

            if (error) {
                toast.error(getErrorMessage(error));
                return;
            }

            toast.success(`Training ${id} created`);
            form.reset();
        });
    }

    const handleContinueClick = () => {
        // Close the dialog regardless of validation
        form.handleSubmit(handleSubmit)();

        setIsDialogOpen(false);

        // Trigger form validation and submission
    };

    return (
        <div className="border-zinc-200 dark:border-zinc-800 shadow-md mt-4 rounded-xl border p-4">
            <h2 className="text-2xl font-extrabold mb-4">
                Training Completion Form
            </h2>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                >
                    <FormField
                        control={form.control}
                        name="trainerId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Trainer's Name</FormLabel>
                                <Popover
                                    open={trainerPopoverOpen}
                                    onOpenChange={setTrainerPopoverOpen}
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
                                                    ? trainers.find(
                                                          (trainer) =>
                                                              trainer.value ===
                                                              field.value
                                                      )?.label
                                                    : "Select Trainer"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        {trainersLoading ? (
                                            <Loader2
                                                className="size-4 animate-spin"
                                                color="#993534"
                                            />
                                        ) : (
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search Trainers..."
                                                    className="h-9"
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        No trainers found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {trainers.map(
                                                            (trainer) => (
                                                                <CommandItem
                                                                    value={
                                                                        trainer.label
                                                                    }
                                                                    key={
                                                                        trainer.value
                                                                    }
                                                                    onSelect={() => {
                                                                        form.setValue(
                                                                            "trainerId",
                                                                            trainer.value
                                                                        );
                                                                        setTrainerPopoverOpen(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    {
                                                                        trainer.label
                                                                    }
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto",
                                                                            trainer.value ===
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
                                    This is the name of the trooper who ran the
                                    training.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="qualificationId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Qualification Name</FormLabel>
                                <Popover
                                    open={qualificationPopoverOpen}
                                    onOpenChange={setQualificationPopoverOpen}
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
                                                    ? qualifications.find(
                                                          (qualification) =>
                                                              qualification.id ===
                                                              field.value
                                                      )?.name
                                                    : "Select Qualification"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        {qualificationsLoading ? (
                                            <Loader2
                                                className="size-4 animate-spin"
                                                color="#993534"
                                            />
                                        ) : (
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search Qualifications..."
                                                    className="h-9"
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        No qualifications found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {qualifications.map(
                                                            (qualification) => (
                                                                <CommandItem
                                                                    value={
                                                                        qualification.name
                                                                    }
                                                                    key={
                                                                        qualification.id
                                                                    }
                                                                    onSelect={() => {
                                                                        form.setValue(
                                                                            "qualificationId",
                                                                            qualification.id
                                                                        );
                                                                        setQualificationPopoverOpen(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    {
                                                                        qualification.name
                                                                    }
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto",
                                                                            qualification.id ===
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
                                    This is the name of the qualification that
                                    was ran.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="traineeIds"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Trainees</FormLabel>
                                <MultiSelector
                                    key="trooperSelector"
                                    values={field.value || []}
                                    onValuesChange={field.onChange}
                                    loop
                                    className="max-w-full"
                                    options={troopers}
                                >
                                    <MultiSelectorTrigger>
                                        <MultiSelectorInput placeholder="Enter Trainees" />
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
                                    This is the list of troopers who were
                                    trained.
                                </FormDescription>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="trainingDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Training Date</FormLabel>
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
                                    The date the training was completed.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="trainingNotes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Training Notes</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Feel free to add any notes about the training here."
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    You can mention if any qual leads or 2ICs
                                    were present.
                                </FormDescription>
                                <FormMessage />
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
