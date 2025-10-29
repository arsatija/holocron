"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
    CalendarIcon,
    Loader2,
    Clock,
    ArrowLeft,
    Edit,
    MapPin,
    Users,
    Crown,
    Newspaper,
    Notebook,
} from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn, getFullTrooperName } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { CampaignEvent, Trooper } from "@/db/schema";
import { getTroopersAsOptions } from "@/services/troopers";
import { Badge } from "@/components/ui/badge";
import TiptapEditor from "@/components/tiptap/editor";
import ManageAttendanceDialog from "./_components/manage-attendance-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { EventEntry, TrooperBasicInfo } from "@/lib/types";

interface AttendanceData {
    id: string;
    trooperId: string;
    trooper: TrooperBasicInfo;
    billetId: string | null;
    billetRole: string | null;
    billetPriority: number;
    unitElementName: string | null;
    unitElementId: string | null;
    unitElementParentId: string | null;
    unitElementPriority: number | null;
}

interface UnitElement {
    id: string;
    name: string;
    parentId: string | null;
    priority: number;
}

interface UnitAttendance {
    attendees: AttendanceData[];
    unitId: string | null;
    unitPriority: number;
    unitParentId: string | null;
    unitName: string;
}

const editEventSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Event name is required").max(255, "Name too long"),
    description: z.string().optional(),
    eventDate: z.date({
        required_error: "Event date is required",
    }),
    eventTime: z.string().optional(),
    eventType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint"]),
    zeusId: z.string().optional(),
    coZeusIds: z.array(z.string()).optional(),
    eventNotes: z.string().optional(),
    trooperIds: z.array(z.string()).default([]),
});

type EditEventFormData = z.infer<typeof editEventSchema>;

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.campaignId as string;
    const eventId = params.eventId as string;

    const [isPending, startTransition] = useTransition();
    const [event, setEvent] = useState<EventEntry | null>(null);
    const [campaignEventForDialog, setCampaignEventForDialog] =
        useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
    const [attendanceByUnit, setAttendanceByUnit] = useState<
        Record<string, UnitAttendance>
    >({});
    const [allUnits, setAllUnits] = useState<UnitElement[]>([]);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [trooperOptions, setTrooperOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [zeusTrooper, setZeusTrooper] = useState<TrooperBasicInfo | null>(
        null
    );
    const [coZeusTroopers, setCoZeusTroopers] = useState<TrooperBasicInfo[]>(
        []
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const form = useForm<EditEventFormData>({
        resolver: zodResolver(editEventSchema),
        defaultValues: {
            id: "",
            name: "",
            description: "",
            eventDate: new Date(),
            eventTime: "",
            eventType: "Main",
            eventNotes: "",
            trooperIds: [],
        },
    });

    useEffect(() => {
        const fetchTroopers = async () => {
            try {
                const options = await getTroopersAsOptions();
                setTrooperOptions(options);
            } catch (error) {
                console.error("Error fetching troopers:", error);
            }
        };
        fetchTroopers();
        fetchEvent();
    }, []);

    const onSubmit = (data: EditEventFormData) => {
        startTransition(async () => {
            try {
                const requestBody = {
                    ...data,
                    eventDate: data.eventDate.toISOString().split("T")[0],
                };
                const response = await fetch("/api/v1/campaign-events", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                });

                if (response.ok) {
                    toast.success("Event updated successfully");
                    setIsEditing(false);
                    fetchEvent();
                } else {
                    const error = await response.json();
                    toast.error(error.error || "Failed to update event");
                }
            } catch (error) {
                console.error("Error updating event:", error);
                toast.error("Failed to update event");
            }
        });
    };

    const fetchEvent = async () => {
        try {
            const response = await fetch(
                `/api/v1/campaign-events?eventId=${eventId}`
            );
            if (response.ok) {
                const eventData: EventEntry = await response.json();
                setEvent(eventData);

                // Create a mock CampaignEvent object for the dialog
                setCampaignEventForDialog({
                    id: eventData.id,
                    name: eventData.name,
                    description: eventData.description,
                    eventDate: eventData.eventDate,
                    eventTime: eventData.eventTime,
                    eventType: eventData.eventType,
                    campaignId: campaignId,
                    zeusId: eventData.zeus?.id || null,
                    coZeusIds: eventData.coZeus?.map((cz) => cz.id) || null,
                    eventNotes: eventData.eventNotes,
                    attendanceId: eventData.attendanceId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                // Set Zeus and Co-Zeus from the EventEntry response
                setZeusTrooper(eventData.zeus);
                setCoZeusTroopers(eventData.coZeus || []);

                // Fetch attendance by unit if the event has an attendanceId
                let trooperIds: string[] = [];
                if (eventData.id && eventData.attendanceId) {
                    const attendanceResponse = await fetch(
                        `/api/v1/campaign-events/${eventData.id}/attendance`
                    );
                    if (attendanceResponse.ok) {
                        const responseData = await attendanceResponse.json();
                        const attendanceData: AttendanceData[] =
                            responseData.attendances;
                        const allUnitsData: UnitElement[] =
                            responseData.allUnits;

                        console.log("attendanceData", attendanceData);
                        console.log("allUnitsData", allUnitsData);

                        // Store all units
                        setAllUnits(allUnitsData);

                        // Extract trooper IDs
                        trooperIds = attendanceData.map((att) => att.trooperId);

                        // Organize by unit element name, but only for units that have attendees
                        const organized: Record<string, UnitAttendance> = {};
                        attendanceData.forEach((att) => {
                            const unitName =
                                att.unitElementName || "Unbilleted";
                            const unitId = att.unitElementId;
                            const unitPriority = att.unitElementPriority;
                            const unitParentId = att.unitElementParentId;
                            if (!organized[unitName]) {
                                organized[unitName] = {
                                    attendees: [],
                                    unitId: unitId,
                                    unitPriority: unitPriority ?? 999,
                                    unitParentId: unitParentId,
                                    unitName: unitName,
                                };
                            }
                            organized[unitName].attendees.push(att);
                        });
                        setAttendanceCount(attendanceData.length);
                        setAttendanceByUnit(organized);
                    }
                } else {
                    setAttendanceByUnit({});
                    setAllUnits([]);
                    setAttendanceCount(0);
                }

                form.reset({
                    id: eventData.id,
                    name: eventData.name,
                    description: eventData.description || "",
                    eventDate: new Date(eventData.eventDate),
                    eventTime: eventData.eventTime || "",
                    eventType: eventData.eventType as
                        | "Main"
                        | "Skirmish"
                        | "Fun"
                        | "Raid"
                        | "Joint",
                    zeusId: eventData.zeus?.id || "",
                    coZeusIds: eventData.coZeus?.map((cz) => cz.id) || [],
                    eventNotes: eventData.eventNotes || "",
                    trooperIds: trooperIds,
                });
            } else {
                toast.error("Failed to load event");
            }
        } catch (error) {
            console.error("Error fetching event:", error);
            toast.error("Failed to load event");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(
                `/api/v1/campaign-events?eventId=${eventId}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                toast.success("Event deleted successfully");
                router.push(`/campaigns/${campaignId}`);
            } else {
                toast.error("Failed to delete event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("Failed to delete event");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto p-6">
                <p>Event not found</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <Button variant="ghost" className="mb-6" asChild>
                <a href={`/campaigns/`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Campaign
                </a>
            </Button>

            <>
                {/* Banner Image - First component */}
                {event.bannerImage && (
                    <div className="mb-4 w-full overflow-hidden rounded-lg">
                        <AspectRatio ratio={4 / 1}>
                            <img
                                src={event.bannerImage}
                                alt={event.name}
                                className="w-full h-full object-cover"
                            />
                        </AspectRatio>
                    </div>
                )}

                {/* Event Title and Actions */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {event.name}
                        </h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                {format(new Date(event.eventDate), "PPP")}
                                {event.eventTime && ` at ${event.eventTime}`}
                            </div>
                            <Badge variant="outline">{event.eventType}</Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <ProtectedComponent
                            allowedPermissions={[
                                "Admin",
                                RankLevel.Command,
                                RankLevel.Company,
                            ]}
                        >
                            <Button
                                onClick={() => setIsAttendanceDialogOpen(true)}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Manage Attendance
                            </Button>
                            <Button
                                onClick={() =>
                                    router.push(
                                        `/campaigns/${campaignId}/events/${eventId}/edit`
                                    )
                                }
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Event
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </ProtectedComponent>
                    </div>
                </div>

                {/* Zeus and Co-Zeus */}
                {(zeusTrooper || coZeusTroopers.length > 0) && (
                    <Card className="mb-6">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                Zeus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-6">
                                {zeusTrooper && (
                                    <div>
                                        <div className="text-sm font-semibold text-muted-foreground">
                                            Main Zeus
                                        </div>
                                        <a
                                            href={`/trooper/${zeusTrooper.id}`}
                                            className="text-lg font-medium hover:underline"
                                        >
                                            {zeusTrooper.rank
                                                ? getFullTrooperName({
                                                      name: zeusTrooper.name,
                                                      numbers:
                                                          zeusTrooper.numbers,
                                                      rank: zeusTrooper.rank,
                                                  })
                                                : zeusTrooper.name || "Unknown"}
                                        </a>
                                    </div>
                                )}

                                {coZeusTroopers.length > 0 && (
                                    <div>
                                        <div className="text-sm font-semibold text-muted-foreground">
                                            Co-Zeus
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {coZeusTroopers.map((coZeus) => (
                                                <a
                                                    key={coZeus.id}
                                                    className="text-lg font-medium hover:underline"
                                                    href={`/trooper/${coZeus.id}`}
                                                >
                                                    {coZeus.rank
                                                        ? getFullTrooperName({
                                                              name: coZeus.name,
                                                              numbers:
                                                                  coZeus.numbers,
                                                              rank: coZeus.rank,
                                                          })
                                                        : coZeus.name ||
                                                          "Unknown"}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {event.description && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Newspaper className="h-4 w-4" />
                                Brief
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TiptapEditor
                                value={event.description}
                                editable={false}
                                className="prose prose-zinc dark:prose-invert max-w-none border-0"
                            />
                        </CardContent>
                    </Card>
                )}

                {event.eventNotes && (
                    <ProtectedComponent
                        allowedPermissions={[
                            RankLevel.Command,
                            RankLevel.Company,
                            RankLevel.JNCO,
                            RankLevel.SNCO,
                        ]}
                    >
                        <Card className="mb-6 bg-muted dark:bg-muted">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Notebook className="h-4 w-4" />
                                    Notes
                                </CardTitle>
                                <span className="ml-6 text-xs text-muted-foreground">
                                    NCO
                                </span>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-line">
                                    {event.eventNotes}
                                </p>
                            </CardContent>
                        </Card>
                    </ProtectedComponent>
                )}

                {/* Regular Attendees Organized by Unit */}
                {Object.keys(attendanceByUnit).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Attendance{" "}
                                {attendanceCount > 0
                                    ? `(${attendanceCount})`
                                    : ""}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(() => {
                                    // Build a complete unit hierarchy using allUnits
                                    const unitMap = new Map<
                                        string,
                                        UnitElement
                                    >();
                                    allUnits.forEach((unit) => {
                                        unitMap.set(unit.id, unit);
                                    });

                                    // Create a map of attendance data by unit ID
                                    const attendanceMap = new Map<
                                        string,
                                        UnitAttendance
                                    >();
                                    Object.entries(attendanceByUnit).forEach(
                                        ([name, data]) => {
                                            if (data.unitId) {
                                                attendanceMap.set(
                                                    data.unitId,
                                                    data
                                                );
                                            }
                                        }
                                    );

                                    // Result array: units with attendees in proper hierarchical order
                                    const sortedUnits: UnitAttendance[] = [];
                                    const processed = new Set<string>();

                                    // Recursive function to add a unit and its children
                                    const addUnitAndChildren = (
                                        unitId: string
                                    ) => {
                                        if (processed.has(unitId)) return;
                                        processed.add(unitId);

                                        // Only add if this unit has attendees
                                        const attendance =
                                            attendanceMap.get(unitId);
                                        if (attendance) {
                                            sortedUnits.push(attendance);
                                        }

                                        // Find and add children, sorted by priority
                                        const children = allUnits
                                            .filter(
                                                (u) => u.parentId === unitId
                                            )
                                            .sort(
                                                (a, b) =>
                                                    a.priority - b.priority
                                            );

                                        children.forEach((child) => {
                                            addUnitAndChildren(child.id);
                                        });
                                    };

                                    // Start with top-level units (parentId === null), sorted by priority
                                    const topLevel = allUnits
                                        .filter((u) => u.parentId === null)
                                        .sort(
                                            (a, b) => a.priority - b.priority
                                        );

                                    topLevel.forEach((unit) => {
                                        addUnitAndChildren(unit.id);
                                    });

                                    // Add any attendance units that weren't in the hierarchy (e.g., "Unbilleted")
                                    Object.values(attendanceByUnit).forEach(
                                        (attendance) => {
                                            if (
                                                !attendance.unitId ||
                                                !processed.has(
                                                    attendance.unitId
                                                )
                                            ) {
                                                sortedUnits.push(attendance);
                                            }
                                        }
                                    );

                                    return sortedUnits;
                                })().map((unitData: UnitAttendance) => (
                                    <div
                                        key={
                                            unitData.unitId || unitData.unitName
                                        }
                                        className="border rounded-lg p-4"
                                    >
                                        <h4 className="font-semibold mb-3 text-lg">
                                            {unitData.unitName}
                                        </h4>
                                        <div className="space-y-2">
                                            {unitData.attendees
                                                .sort(
                                                    (a, b) =>
                                                        a.billetPriority -
                                                        b.billetPriority
                                                )
                                                .map((att: AttendanceData) => {
                                                    // Filter out Zeus and Co-Zeus
                                                    const isZeusOrCoZeus =
                                                        att.trooperId ===
                                                            event.zeus?.id ||
                                                        event.coZeus?.some(
                                                            (cz) =>
                                                                cz.id ===
                                                                att.trooperId
                                                        );

                                                    if (isZeusOrCoZeus)
                                                        return null;

                                                    return (
                                                        <div
                                                            key={att.id}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <a
                                                                href={`/trooper/${att.trooperId}`}
                                                                className="font-medium hover:underline"
                                                            >
                                                                {getFullTrooperName(
                                                                    att.trooper
                                                                )}
                                                            </a>
                                                            {att.billetRole && (
                                                                <Badge variant="outline">
                                                                    {
                                                                        att.billetRole
                                                                    }
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </>

            {campaignEventForDialog && campaignEventForDialog.id && (
                <ManageAttendanceDialog
                    event={campaignEventForDialog}
                    open={isAttendanceDialogOpen}
                    onOpenChange={setIsAttendanceDialogOpen}
                    onAttendanceUpdated={fetchEvent}
                />
            )}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this event and remove its data from our
                            servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
