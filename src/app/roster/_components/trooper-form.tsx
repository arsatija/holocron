"use client";
import {
    createTrooper,
    deleteTrooper,
    getAllTrooperDesignations,
} from "@/services/troopers";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ranks } from "@/lib/definitions";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditTrooper } from "@/lib/types";
import { toast } from "sonner";
import { create, update } from "../_lib/actions";
import { getErrorMessage } from "@/lib/handle-error";

const formSchema = z
    .object({
        id: z.string().optional(),
        name: z
            .string()
            .regex(
                /^\d{4}\s"[^"]*"$/,
                'It is IMPERATIVE that you use the following format: 0000 "Name" [Ex. 0000 "Disney"]'
            )
            .refine(
                async (data) => {
                    if (data == "" || !data.includes(" ")) return false;
                    const [numbers, name] = data.split(" ");
                    const recruitName = name.replace(/"/g, "").toLowerCase();
                    return parseInt(numbers) >= 1000;
                },
                { message: "This name or number is already taken." }
            ),
        status: z.enum(["Active", "Inactive", "Discharged"]).default("Active"),
        rank: z.number().min(1).max(Object.keys(ranks).length),
        recruitmentDate: z
            .date({
                required_error: "Recruitment date is required.",
            })
            .default(new Date()),
        billet: z.string().nullable().optional(),
    })
    .refine(
        (data) => {
            if (data.status === "Discharged") {
                return data.billet === null;
            }
            return true;
        },
        {
            message: "Discharged troopers cannot have a billet assignment",
            path: ["billet"],
        }
    );

export default function TrooperForm(props: {
    dialogCallback: (open: boolean) => void;
    editTrooper?: EditTrooper;
}) {
    const { editTrooper, dialogCallback } = props;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: editTrooper
            ? {
                  id: editTrooper.id,
                  name: `${editTrooper.numbers} "${editTrooper.name}"`,
                  status: editTrooper.status,
                  rank: editTrooper.rank,
                  recruitmentDate: new Date(editTrooper.recruitmentDate),
                  billet: editTrooper.billetId,
              }
            : undefined,
    });

    const mode = editTrooper ? "Edit" : "Create";

    const [rankPopoverOpen, setRankPopoverOpen] = useState(false);
    const [billetPopoverOpen, setBilletPopoverOpen] = useState(false);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

    const [billetOptions, setBilletOptions] = useState<
        { label: string; value: string }[]
    >([]);

    const [isBilletsLoading, setBilletsLoading] = useState(true);
    const [isRanksLoading, setRanksLoading] = useState(true);
    const [isEditLoading, setEditLoading] = useState(
        editTrooper ? true : false
    );

    const [rankOptions, setRankOptions] = useState<
        { label: string; value: number }[]
    >([]);

    const fetchDataAction = async () => {
        fetch(
            `/api/v1/billetsList${
                editTrooper ? `?trooperId=${editTrooper.id}` : ""
            }`
        )
            .then((response) => response.json())
            .then((data) => {
                data.push({
                    label: "Unbilleted",
                    value: null,
                });
                console.log("billetList: ", data);
                setBilletOptions(data);
                setBilletsLoading(false);
            })
            .catch((error) => console.error("Error loading billets:", error));

        fetch("/api/v1/ranksList")
            .then((response) => response.json())
            .then((data) => {
                setRankOptions(data);
                setRanksLoading(false);
            })
            .catch((error) => console.error("Error loading ranks:", error));

        if (editTrooper) {
            fetch(`/api/v1/trooperBillet?trooperId=${editTrooper.id}`)
                .then((response) => response.json())
                .then((data) => {
                    console.log(data);
                    editTrooper.billetId = data.billet?.billetId;
                    form.setValue("billet", data.billet?.billetId);
                    setEditLoading(false);
                })
                .catch((error) =>
                    console.error("Error loading billets:", error)
                );
        }
    };

    useEffect(() => {
        fetchDataAction();
        console.log("editTrooper: ", editTrooper);
    }, []);

    const [isSubmitPending, startSubmitTransition] = useTransition();

    function handleSubmit(values: z.infer<typeof formSchema>) {
        startSubmitTransition(async () => {
            let id, error;

            // if (values.billet === "") {
            //     values.billet = undefined;
            // }

            console.log(values);

            console.log("mode: ", mode);
            if (mode === "Edit") {
                ({ id, error } = await update(values));
            } else if (mode === "Create") {
                ({ id, error } = await create(values));
            }

            if (error) {
                toast.error(getErrorMessage(error));
                return;
            }

            toast.success(`Trooper ${id} ${mode}ed`);
        });

        dialogCallback(false);
    }

    const handleContinueClick = () => {
        // Close the dialog regardless of validation
        form.handleSubmit(handleSubmit)();

        setIsAlertDialogOpen(false);

        // Trigger form validation and submission
    };
    const nameExample = '0000 "Name"';
    return (
        <div>
            {isEditLoading || isRanksLoading || isBilletsLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="size-4 animate-spin" color="#993534" />
                </div>
            ) : (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trooper Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={nameExample}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This is the name of the trooper. Ensure
                                        the name is between 1000 and 9999.
                                        Ensure the name is NOT taken already by
                                        checking the{" "}
                                        <Link
                                            className="underline"
                                            href="/roster"
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            Unit Roster
                                        </Link>
                                        .
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={
                                                editTrooper?.status ?? "Active"
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an activity status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Active">
                                                    Active
                                                </SelectItem>
                                                <SelectItem value="Inactive">
                                                    Inactive
                                                </SelectItem>
                                                <SelectItem value="Discharged">
                                                    Discharged
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rank"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Rank</FormLabel>
                                    <Popover
                                        open={rankPopoverOpen}
                                        onOpenChange={setRankPopoverOpen}
                                        modal={true}
                                    >
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    type="button"
                                                    className={cn(
                                                        "w-auto justify-between",
                                                        !field.value &&
                                                            "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? rankOptions.find(
                                                              (rank) =>
                                                                  rank.value ===
                                                                  field.value
                                                          )?.label
                                                        : "Select Rank"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search Ranks..."
                                                    className="h-9"
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        No ranks found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {rankOptions.map(
                                                            (rank) => (
                                                                <CommandItem
                                                                    value={
                                                                        rank.label
                                                                    }
                                                                    key={
                                                                        rank.value
                                                                    }
                                                                    onSelect={() => {
                                                                        form.setValue(
                                                                            "rank",
                                                                            rank.value
                                                                        );
                                                                        setRankPopoverOpen(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    {rank.label}
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto",
                                                                            rank.value ===
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
                                    <FormDescription>
                                        This is the rank of the trooper.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="recruitmentDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Recruitment Date</FormLabel>
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
                                                    date <
                                                        new Date("2024-12-16")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        The date the trooper joined the unit.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="billet"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Billet</FormLabel>
                                    <Popover
                                        open={billetPopoverOpen}
                                        onOpenChange={setBilletPopoverOpen}
                                        modal={true}
                                    >
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    type="button"
                                                    className={cn(
                                                        "w-auto justify-between",
                                                        !field.value &&
                                                            "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? billetOptions.find(
                                                              (billet) =>
                                                                  billet.value ===
                                                                  field.value
                                                          )?.label
                                                        : field.value === ""
                                                        ? "Unbilleted"
                                                        : "Select Billet"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search Billets..."
                                                    className="h-9"
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        No open billets found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {billetOptions.map(
                                                            (billet) => (
                                                                <CommandItem
                                                                    value={
                                                                        billet.label
                                                                    }
                                                                    key={
                                                                        billet.value
                                                                    }
                                                                    onSelect={() => {
                                                                        form.setValue(
                                                                            "billet",
                                                                            billet.value
                                                                        );
                                                                        setBilletPopoverOpen(
                                                                            false
                                                                        );
                                                                    }}
                                                                >
                                                                    {
                                                                        billet.label
                                                                    }
                                                                    <Check
                                                                        className={cn(
                                                                            "ml-auto",
                                                                            billet.value ===
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
                                    <FormDescription>
                                        This is the billet of the trooper. NOTE:
                                        Can leave this blank if unbilleted.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <AlertDialog
                            open={isAlertDialogOpen}
                            onOpenChange={setIsAlertDialogOpen}
                        >
                            <AlertDialogTrigger asChild>
                                <Button>Submit</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Is all of the information correct?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Please double check the information you
                                        have entered as this will immediately
                                        affect the unit records.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleContinueClick}
                                        disabled={isSubmitPending}
                                    >
                                        {isSubmitPending && (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        )}
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </form>
                </Form>
            )}
        </div>
    );
}
