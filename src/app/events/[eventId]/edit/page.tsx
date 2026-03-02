"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Loader2, CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Calendar } from "@/components/ui/calendar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

const KIND_PERMISSIONS: Record<string, string[]> = {
    Operation: ["Zeus", "Admin", RankLevel.Command],
    Training: ["Training", "Admin", RankLevel.Command],
    Meeting: ["Admin", RankLevel.Company, RankLevel.Command],
    Social: ["Admin", RankLevel.JNCO, RankLevel.SNCO, RankLevel.Company, RankLevel.Command],
};

type EventKind = "Operation" | "Training" | "Meeting" | "Social";

type EventData = {
    id: string;
    name: string;
    description: string | null;
    bannerImage: string | null;
    eventDate: string;
    eventTime: string | null;
    eventEndTime: string | null;
    eventKind: EventKind;
    campaignId: string | null;
    seriesId: string | null;
    operation: {
        operationType: string;
    } | null;
    trainingEvent: {
        qualificationId: string | null;
        scheduledTrainerId: string | null;
    } | null;
};

type TrooperOption = { id: string; name: string; numbers: number; rank: number };
type CampaignOption = { id: string; name: string; isActive?: boolean };
type QualificationOption = { id: string; name: string; abbreviation: string };

function TrooperCombobox({
    value,
    onChange,
    troopers,
}: {
    value: string;
    onChange: (val: string) => void;
    troopers: TrooperOption[];
}) {
    const [open, setOpen] = useState(false);
    const selected = troopers.find((t) => t.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                >
                    {selected ? `${selected.numbers} ${selected.name}` : "Select trainer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search by name or number..." />
                    <CommandList>
                        <CommandEmpty>No trooper found.</CommandEmpty>
                        <CommandGroup>
                            {value && (
                                <CommandItem
                                    value="__clear__"
                                    onSelect={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                >
                                    <span className="text-muted-foreground italic">Clear selection</span>
                                </CommandItem>
                            )}
                            {troopers.map((t) => (
                                <CommandItem
                                    key={t.id}
                                    value={`${t.numbers} ${t.name}`}
                                    onSelect={() => {
                                        onChange(t.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === t.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {t.numbers} {t.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.eventId as string;

    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Event data
    const [event, setEvent] = useState<EventData | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [bannerImage, setBannerImage] = useState("");
    const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
    const [eventTime, setEventTime] = useState("");
    const [eventEndTime, setEventEndTime] = useState("");
    const [campaignId, setCampaignId] = useState("none");
    const [qualificationId, setQualificationId] = useState("none");
    const [scheduledTrainerId, setScheduledTrainerId] = useState("");

    // Reference data
    const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
    const [qualifications, setQualifications] = useState<QualificationOption[]>([]);
    const [troopers, setTroopers] = useState<TrooperOption[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [eventRes, campaignsRes, qualsRes, troopersRes] = await Promise.all([
                    fetch(`/api/v1/events/${eventId}`),
                    fetch("/api/v1/campaigns"),
                    fetch("/api/v1/qualificationList"),
                    fetch("/api/v1/troopersList"),
                ]);

                if (!eventRes.ok) {
                    toast.error("Event not found");
                    router.push("/events");
                    return;
                }

                const [eventData, campaignsData, qualsData, troopersData] = await Promise.all([
                    eventRes.json() as Promise<EventData>,
                    campaignsRes.json() as Promise<CampaignOption[]>,
                    qualsRes.json() as Promise<QualificationOption[]>,
                    troopersRes.json() as Promise<TrooperOption[]>,
                ]);

                setEvent(eventData);
                setName(eventData.name ?? "");
                setDescription(eventData.description ?? "");
                setBannerImage(eventData.bannerImage ?? "");
                setEventDate(parseLocalDate(eventData.eventDate));
                setEventTime(eventData.eventTime ?? "");
                setEventEndTime(eventData.eventEndTime ?? "");
                setCampaignId(eventData.campaignId ?? "none");
                setQualificationId(eventData.trainingEvent?.qualificationId ?? "none");
                setScheduledTrainerId(eventData.trainingEvent?.scheduledTrainerId ?? "");

                setCampaigns(campaignsData.filter((c) => c.isActive !== false));
                setQualifications(qualsData);
                setTroopers(troopersData);
            } catch {
                toast.error("Failed to load event");
                router.push("/events");
            } finally {
                setLoading(false);
            }
        }

        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const handleSave = () => {
        if (!eventDate) {
            toast.error("Please select a date");
            return;
        }

        startTransition(async () => {
            try {
                const isOperation = event?.eventKind === "Operation";
                const isTraining = event?.eventKind === "Training";

                const payload: Record<string, unknown> = {
                    eventDate: format(eventDate, "yyyy-MM-dd"),
                    eventTime: eventTime || null,
                    eventEndTime: isTraining ? (eventEndTime || null) : null,
                    campaignId: campaignId === "none" ? null : campaignId || null,
                    description: description || null,
                    bannerImage: bannerImage || null,
                };

                if (!isOperation) {
                    payload.name = name || event?.name;
                }

                if (isTraining) {
                    payload.qualificationId = qualificationId === "none" ? null : qualificationId || null;
                    payload.scheduledTrainerId = scheduledTrainerId || null;
                }

                const res = await fetch(`/api/v1/events/${eventId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error ?? "Failed to update event");
                    return;
                }

                toast.success("Event updated");
                router.push(`/events/${eventId}`);
            } catch {
                toast.error("Failed to update event");
            }
        });
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/v1/events/${eventId}`, { method: "DELETE" });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error ?? "Failed to delete event");
                return;
            }

            toast.success("Event deleted");
            router.push("/events");
        } catch {
            toast.error("Failed to delete event");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading || !event) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const permissions = KIND_PERMISSIONS[event.eventKind] ?? ["Admin", RankLevel.Command];
    const isOperation = event.eventKind === "Operation";
    const isTraining = event.eventKind === "Training";

    return (
        <ProtectedRoute allowedPermissions={permissions}>
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8 max-w-3xl">
                    {/* Back link */}
                    <Link
                        href={`/events/${eventId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Event
                    </Link>

                    <h1 className="text-2xl font-bold tracking-tight mb-1">Edit Event</h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        {isOperation ? event.name : `Editing ${event.eventKind.toLowerCase()}`}
                    </p>

                    <div className="space-y-5">
                        {/* Name — hidden for Operations (name comes from the brief) */}
                        {!isOperation && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Event Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Event name"
                                />
                            </div>
                        )}

                        {/* Date */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !eventDate && "text-muted-foreground"
                                        )}
                                    >
                                        {eventDate ? format(eventDate, "PPP") : "Pick a date"}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={eventDate}
                                        onSelect={setEventDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time */}
                        <div className={cn("grid gap-4", isTraining ? "grid-cols-2" : "grid-cols-1")}>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">
                                    {isTraining ? "Start Time (EST)" : "Time (EST, optional)"}
                                </label>
                                <Input
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    placeholder="HH:MM"
                                />
                            </div>
                            {isTraining && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">End Time (EST, optional)</label>
                                    <Input
                                        value={eventEndTime}
                                        onChange={(e) => setEventEndTime(e.target.value)}
                                        placeholder="HH:MM"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Campaign */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Campaign (optional)</label>
                            <Select value={campaignId} onValueChange={setCampaignId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Standalone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Standalone</SelectItem>
                                    {campaigns.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Training-specific fields */}
                        {isTraining && (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Qualification (optional)</label>
                                    <Select value={qualificationId} onValueChange={setQualificationId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select qualification" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {qualifications.map((q) => (
                                                <SelectItem key={q.id} value={q.id}>
                                                    {q.abbreviation} — {q.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Trainer (optional)</label>
                                    <TrooperCombobox
                                        value={scheduledTrainerId}
                                        onChange={setScheduledTrainerId}
                                        troopers={troopers}
                                    />
                                </div>
                            </>
                        )}

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Description (optional)</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add event description..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Banner Image */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Banner Image URL (optional)</label>
                            <Input
                                value={bannerImage}
                                onChange={(e) => setBannerImage(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={isPending}
                            >
                                Delete Event
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isPending}>
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The event and all associated data will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Event"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ProtectedRoute>
    );
}
