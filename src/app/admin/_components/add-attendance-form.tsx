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
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useEffect, useState } from "react";
import LoaderSm from "@/app/loader-sm";
import { MultiSelect } from "@/components/ui/multi-select";
import { format } from "date-fns";

const formSchema = z.object({
    zeusId: z.string().uuid({
        message: "Invalid Zeus ID",
    }),
    coZeusIds: z
        .array(
            z.string().uuid({
                message: "Invalid Co-Zeus ID",
            })
        )
        .optional(),
    eventDate: z
        .date({
            required_error: "Operation date is required",
        })
        .default(new Date()),
    eventName: z.string().min(1),
    trooperIds: z.array(
        z.string().uuid({
            message: "Invalid Trooper ID",
        })
    ),
});

export default function AddAttendanceForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const [isMainZeusPopoverOpen, setIsMainZeusPopoverOpen] = useState(false);
    const [isCoZeusPopoverOpen, setIsCoZeusPopoverOpen] = useState(false);
    const [isTroopersPopoverOpen, setIsTroopersPopoverOpen] = useState(false);
    const [troopers, setTroopers] = useState<
        { value: string; label: string }[]
    >([]);
    const [troopersLoading, setTroopersLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/troopersList")
            .then((response) => response.json())
            .then((data) => {
                setTroopers(data);
                setTroopersLoading(false);
            })
            .catch((error) => console.error("Error loading troopers:", error));
    }, []);

    function handleSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
    }

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
                                            <LoaderSm />
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
                                <MultiSelect
                                    options={troopers}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Select Trainees"
                                    variant="inverted"
                                    maxCount={3}
                                    animation={0}
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                    )}
                                />
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
                </form>
            </Form>
        </div>
    );
}
