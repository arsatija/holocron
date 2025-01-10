"use client";

import { insertTrooperSchema, NewTrooper } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { create } from "./_lib/actions";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
import { ChevronsUpDown, Check } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { toast } from "sonner";

const formSchema = z.object({
    age: z.boolean(),
    microphone: z.boolean(),
    referral: z.string({
        required_error:
            "Please select how the recruit found out about the unit.",
    }),
    referred_by: z.string().optional(),
    recruit_name: z
        .string()
        .regex(
            /^\d{4}\s"[^"]*"$/,
            'It is IMPERATIVE that you use the following format: 0000 "Name" [Ex. 0000 "Disney"]'
        ),
    recruiter_name: z.string(),
});

const referralItems = [
    {
        id: "reddit",
        label: "Reddit",
    },
    {
        id: "referral",
        label: "In-Unit Referral",
    },
    {
        id: "youtube",
        label: "Youtube",
    },
    {
        id: "returning",
        label: "Returning Member",
    },
];

export default function RecruitmentForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const [troopers, setTroopers] = useState<
        { label: string; value: string }[]
    >([]);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/troopersList")
            .then((response) => response.json())
            .then((data) => {
                setTroopers(data);
                setLoading(false);
            })
            .catch((error) => console.error("Error loading troopers:", error));
    }, []);

    function handleSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);

        create(values);

        toast("Recruitment Submitted", {
            description: "Your recruitment has been submitted.",
        });
    }

    const nameExample = '0000 "Name"';
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
            >
                <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Are they over the age of 16+?
                                </FormLabel>
                                <FormDescription>
                                    Inform an SNCO if they are under 16 before
                                    proceeding.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="microphone"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Do they have a working microphone?
                                </FormLabel>
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="referral"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Referral Method</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="reddit">
                                        Reddit
                                    </SelectItem>
                                    <SelectItem value="referral">
                                        In-Unit Referral
                                    </SelectItem>
                                    <SelectItem value="youtube">
                                        Youtube
                                    </SelectItem>
                                    <SelectItem value="returning">
                                        Returning Member
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Select how the recruit found out about the unit.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="referred_by"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Referred By</FormLabel>
                            <Popover>
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
                                                : "Select Referrer"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    {isLoading ? (
                                        <Skeleton className="w-full h-9" />
                                    ) : (
                                        <Command>
                                            <CommandInput
                                                placeholder="Search Troopers..."
                                                className="h-9"
                                            />
                                            <ScrollArea>
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
                                                                            "referred_by",
                                                                            trooper.value
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
                                            </ScrollArea>
                                        </Command>
                                    )}
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                This is the name of the trooper who referred the
                                recruit.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="recruit_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Recruit Name</FormLabel>
                            <FormControl>
                                <Input placeholder={nameExample} {...field} />
                            </FormControl>
                            <FormDescription>
                                This is the name of the recruit (the one being
                                recruited). Ensure the name is NOT taken already
                                by checking the{" "}
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
                    name="recruiter_name"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Recruiter Name</FormLabel>
                            <Popover>
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
                                                : "Select Recruiter"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    {isLoading ? (
                                        <Skeleton className="w-full h-9" />
                                    ) : (
                                        <Command>
                                            <CommandInput
                                                placeholder="Search Troopers..."
                                                className="h-9"
                                            />
                                            <ScrollArea>
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
                                                                            "recruiter_name",
                                                                            trooper.value
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
                                            </ScrollArea>
                                        </Command>
                                    )}
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                This is your name (the one doing the
                                recruiting).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Submit</Button>
            </form>
        </Form>
    );
}
