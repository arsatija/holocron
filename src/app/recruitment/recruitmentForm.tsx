"use client";

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
import { getErrorMessage } from "@/lib/handle-error";
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
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { toast } from "sonner";
import { getAllTrooperDesignations } from "@/services/troopers";
import { formSchema } from "./_lib/validation";
import {
    Dialog,
    DialogFooter,
    DialogTitle,
    DialogHeader,
    DialogContent,
    DialogDescription,
} from "@/components/ui/dialog";

export default function RecruitmentForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            age: false,
            microphone: false,
            referral: "",
            referred_by: null,
            recruit_name: "",
            recruiter_name: "",
        },
    });

    const [referredByPopoverOpen, setReferredByPopoverOpen] = useState(false);
    const [recruiterPopoverOpen, setRecruiterPopoverOpen] = useState(false);

    const [isSubmitting, startSubmitTransition] = useTransition();

    const [troopers, setTroopers] = useState<
        { label: string; value: string }[]
    >([]);
    const [isLoading, setLoading] = useState(true);

    const [inviteLink, setInviteLink] = useState<string>("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        startSubmitTransition(async () => {
            const { id, error } = await create(values);

            if (error) {
                toast.error(getErrorMessage(error));
                return;
            }

            // Generate invite link for the created trooper
            const response = await fetch("/api/v1/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trooperId: id }), // Send trooperId
            });

            if (!response.ok) {
                toast.error("Failed to generate invite link.");
                return;
            }

            const { inviteLink } = await response.json();

            // Show success and open dialog with invite link
            setInviteLink(inviteLink); // Set invite link for the dialog
            setIsDialogOpen(true); // Open dialog

            toast.success(`Trooper ${id} created`);
            form.reset();
        });
    }

    function InviteDialog() {
        const handleCopyToClipboard = () => {
            navigator.clipboard.writeText(inviteLink);
            toast.success("Invite link copied to clipboard!");
        };

        return (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Link Generated</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Copy the link below and send it to the recruit:
                    </DialogDescription>
                    <ScrollArea className="mt-2 mb-4 p-2 border rounded">
                        <code className="">{inviteLink}</code>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    <DialogFooter>
                        <Button
                            onClick={handleCopyToClipboard}
                            variant="outline"
                            className="w-full"
                        >
                            Copy to Clipboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
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
                            <Popover
                                open={referredByPopoverOpen}
                                onOpenChange={setReferredByPopoverOpen}
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
                                                                        setReferredByPopoverOpen(
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
                                recruited). Ensure the name is between 1000 and
                                9999. Ensure the name is NOT taken already by
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
                    name="recruiter_name"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Recruiter Name</FormLabel>
                            <Popover
                                open={recruiterPopoverOpen}
                                onOpenChange={setRecruiterPopoverOpen}
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
                                                                        setRecruiterPopoverOpen(
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

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Submit
                </Button>
            </form>
            <InviteDialog />
        </Form>
    );
}
