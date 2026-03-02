"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Check, ChevronsUpDown } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isPast } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";
import type { EventAttendanceData, TrooperBasicInfo } from "@/lib/types";

const schema = z.object({
    zeusId: z.string().optional(),
    coZeusIds: z.array(z.string()).default([]),
    trooperIds: z.array(z.string()).default([]),
});
type FormData = z.infer<typeof schema>;

interface LogAttendanceButtonProps {
    eventId: string;
    eventDate: string;
    eventTime: string | null;
    attendanceId: string | null;
}

export default function LogAttendanceButton({ eventId, eventDate, eventTime, attendanceId }: LogAttendanceButtonProps) {
    const router = useRouter();
    const { trooperCtx } = useController();
    const [open, setOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [trooperOptions, setTrooperOptions] = useState<{ value: string; label: string }[]>([]);
    const [zeusPopoverOpen, setZeusPopoverOpen] = useState(false);

    const canLog = checkPermissionsSync(trooperCtx, ["Attendance", "Admin", RankLevel.Command]);

    const eventStart = parseLocalDate(eventDate);
    if (eventTime) {
        const [h, m] = eventTime.split(":").map(Number);
        eventStart.setHours(h, m, 0, 0);
    }
    const isPastDate = isPast(eventStart);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { zeusId: "NONE", coZeusIds: [], trooperIds: [] },
    });

    useEffect(() => {
        if (!open) return;
        setIsFetching(true);

        const fetchTroopers = fetch("/api/v1/troopersList").then((r) => r.json());
        const fetchAttendance = attendanceId
            ? fetch(`/api/v1/events/${eventId}/attendance`).then((r) => r.json())
            : Promise.resolve(null);

        Promise.all([fetchTroopers, fetchAttendance])
            .then(([trs, att]) => {
                setTrooperOptions(trs);
                if (att?.attendances) {
                    const zeusId = att.zeus?.id || null;
                    const coZeusIds = (att.coZeus as TrooperBasicInfo[] || []).map((c) => c.id);
                    const allIds = (att.attendances as EventAttendanceData[]).map((a) => a.trooperId);
                    const trooperIds = allIds.filter((id) => id !== zeusId && !coZeusIds.includes(id));
                    form.reset({ zeusId: zeusId ?? "NONE", coZeusIds, trooperIds });
                }
            })
            .catch(() => {})
            .finally(() => setIsFetching(false));
    }, [open]);

    if (!canLog || !isPastDate) return null;

    const onSubmit = async (data: FormData) => {
        setIsPending(true);
        try {
            const body = {
                zeusId: data.zeusId === "NONE" || !data.zeusId ? null : data.zeusId,
                coZeusIds: data.coZeusIds,
                trooperIds: data.trooperIds,
                ...(attendanceId ? { attendanceId } : {}),
            };

            const res = await fetch(`/api/v1/events/${eventId}/attendance`, {
                method: attendanceId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success(attendanceId ? "Attendance updated" : "Attendance logged");
                setOpen(false);
                router.refresh();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save attendance");
            }
        } catch {
            toast.error("Failed to save attendance");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => setOpen(true)}
            >
                <Users className="h-4 w-4 mr-1.5" />
                {attendanceId ? "Update Attendance" : "Log Attendance"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {attendanceId ? "Update Attendance" : "Log Attendance"}
                        </DialogTitle>
                        <DialogDescription>
                            Assign Zeus, Co-Zeus, and attendees for this operation.
                        </DialogDescription>
                    </DialogHeader>

                    {isFetching ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Zeus */}
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
                                                                "w-full justify-between",
                                                                (!field.value || field.value === "NONE") && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value && field.value !== "NONE"
                                                                ? trooperOptions.find((t) => t.value === field.value)?.label
                                                                : "Select Zeus"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search Zeus..." className="h-9" />
                                                        <CommandList>
                                                            <CommandEmpty>No Zeus found.</CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    value="NONE"
                                                                    onSelect={() => {
                                                                        field.onChange(undefined);
                                                                        setZeusPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    None
                                                                    <Check className={cn("ml-auto", (!field.value || field.value === "NONE") ? "opacity-100" : "opacity-0")} />
                                                                </CommandItem>
                                                                {trooperOptions.map((t) => (
                                                                    <CommandItem
                                                                        key={t.value}
                                                                        value={t.label}
                                                                        onSelect={() => {
                                                                            field.onChange(t.value);
                                                                            setZeusPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        {t.label}
                                                                        <Check className={cn("ml-auto", t.value === field.value ? "opacity-100" : "opacity-0")} />
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

                                {/* Co-Zeus */}
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
                                                    className="w-full"
                                                    options={trooperOptions.filter((t) => form.watch("zeusId") !== t.value)}
                                                >
                                                    <MultiSelectorTrigger>
                                                        <MultiSelectorInput placeholder="Add Co-Zeus" />
                                                    </MultiSelectorTrigger>
                                                    <MultiSelectorContent>
                                                        <MultiSelectorList>
                                                            {trooperOptions
                                                                .filter((t) => form.watch("zeusId") !== t.value)
                                                                .map((t) => (
                                                                    <MultiSelectorItem key={t.value} value={t.value}>
                                                                        {t.label}
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

                                {/* Attendees */}
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
                                                    className="w-full"
                                                    options={trooperOptions.filter(
                                                        (t) =>
                                                            form.watch("zeusId") !== t.value &&
                                                            !form.watch("coZeusIds")?.includes(t.value)
                                                    )}
                                                >
                                                    <MultiSelectorTrigger>
                                                        <MultiSelectorInput placeholder="Add Attendees" />
                                                    </MultiSelectorTrigger>
                                                    <MultiSelectorContent>
                                                        <MultiSelectorList>
                                                            {trooperOptions
                                                                .filter(
                                                                    (t) =>
                                                                        form.watch("zeusId") !== t.value &&
                                                                        !form.watch("coZeusIds")?.includes(t.value)
                                                                )
                                                                .map((t) => (
                                                                    <MultiSelectorItem key={t.value} value={t.value}>
                                                                        {t.label}
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
                                        onClick={() => setOpen(false)}
                                        disabled={isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {attendanceId ? "Update Attendance" : "Log Attendance"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
