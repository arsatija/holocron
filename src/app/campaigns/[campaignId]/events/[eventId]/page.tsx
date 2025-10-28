"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Clock, ArrowLeft, Edit, MapPin, Users, Crown } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CampaignEvent } from "@/db/schema";
import { getTroopersAsOptions } from "@/services/troopers";
import { Badge } from "@/components/ui/badge";
import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import ManageAttendanceDialog from "./_components/manage-attendance-dialog";

interface TrooperBasic {
    id: string;
    name: string;
    numbers: number;
    rank?: number;
}

// Extended type to include attendances
interface EventWithAttendances extends CampaignEvent {
    attendances?: Array<{
        trooper: TrooperBasic;
    }>;
}

interface AttendanceData {
    id: string;
    trooperId: string;
    trooper: TrooperBasic;
    billetId: string | null;
    billetRole: string | null;
    unitElementName: string | null;
    unitElementId: string | null;
    unitElementPriority: number | null;
}

interface UnitAttendance {
    attendees: AttendanceData[];
    unitId: string | null;
    unitPriority: number;
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
    const [event, setEvent] = useState<EventWithAttendances | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
    const [attendanceByUnit, setAttendanceByUnit] = useState<Record<string, UnitAttendance>>({});
    const [trooperOptions, setTrooperOptions] = useState<
        Array<{ value: string; label: string }>
    >([]);
    const [zeusTrooper, setZeusTrooper] = useState<TrooperBasic | null>(null);
    const [coZeusTroopers, setCoZeusTroopers] = useState<TrooperBasic[]>([]);

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
    }, []);

    useEffect(() => {
        fetchEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

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
                const eventData = await response.json();
                setEvent(eventData);
                // Extract trooper IDs from attendances
                const trooperIds = eventData.attendances
                    ? eventData.attendances.map((att: any) => att.trooper.id)
                    : [];

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
                    zeusId: eventData.zeusId || "",
                    coZeusIds: eventData.coZeusIds || [],
                    eventNotes: eventData.eventNotes || "",
                    trooperIds: trooperIds,
                });

                // Fetch attendance by unit
                if (eventData.id) {
                    const attendanceResponse = await fetch(
                        `/api/v1/campaign-events/${eventData.id}/attendance`
                    );
                    if (attendanceResponse.ok) {
                        const attendanceData = await attendanceResponse.json();
                        
                        // Fetch Zeus and Co-Zeus separately
                        if (eventData.zeusId) {
                            const zeusData = attendanceData.find((att: any) => att.trooperId === eventData.zeusId);
                            if (zeusData?.trooper) {
                                setZeusTrooper(zeusData.trooper);
                            }
                        }
                        
                        if (eventData.coZeusIds && eventData.coZeusIds.length > 0) {
                            const coZeusData = attendanceData
                                .filter((att: any) => eventData.coZeusIds.includes(att.trooperId))
                                .map((att: any) => att.trooper)
                                .filter(Boolean); // Remove any undefined values
                            setCoZeusTroopers(coZeusData);
                        }
                        
                        // Organize by unit element name
                        const organized: any = {};
                        attendanceData.forEach((att: any) => {
                            const unitName = att.unitElementName || "Unassigned";
                            const unitId = att.unitElementId;
                            const unitPriority = att.unitElementPriority;
                            if (!organized[unitName]) {
                                organized[unitName] = {
                                    attendees: [],
                                    unitId: unitId,
                                    unitPriority: unitPriority || 999
                                };
                            }
                            organized[unitName].attendees.push(att);
                        });
                        setAttendanceByUnit(organized);
                    }
                }
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
            <Button
                variant="ghost"
                className="mb-6"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaign
            </Button>

            {isEditing ? (
                <>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
                        <p className="text-muted-foreground">
                            Update the event details
                        </p>
                    </div>
                    <ProtectedComponent
                allowedPermissions={["Admin", RankLevel.Command, RankLevel.Company]}
                fallback={
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Unauthorized
                            </CardTitle>
                            <CardDescription>
                                You don't have permission to edit events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" onClick={() => router.back()}>
                                Go Back
                            </Button>
                        </CardContent>
                    </Card>
                }
            >
                <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter event name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="eventType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select event type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Main">Main</SelectItem>
                                            <SelectItem value="Skirmish">
                                                Skirmish
                                            </SelectItem>
                                            <SelectItem value="Fun">Fun</SelectItem>
                                            <SelectItem value="Raid">Raid</SelectItem>
                                            <SelectItem value="Joint">Joint</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Brief</FormLabel>
                                <FormControl>
                                    <MinimalTiptap
                                        key={isEditing ? 'editing' : 'viewing'}
                                        content={field.value || ''}
                                        onChange={(content) => field.onChange(content)}
                                        placeholder="Enter event brief"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="eventDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Event Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
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
                                                disabled={(date: Date) =>
                                                    date <
                                                    new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="eventTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Time</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="HH:MM"
                                                className="pl-10"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Format: HH:MM (24-hour)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="eventNotes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Notes</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter event notes"
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex gap-4 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isPending}
                        >
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Update Event
                        </Button>
                    </div>
                </form>
            </Form>
                </ProtectedComponent>
                </>
            ) : (
                <>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
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
                                allowedPermissions={["Admin", RankLevel.Command, RankLevel.Company]}
                            >
                                <Button onClick={() => setIsAttendanceDialogOpen(true)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Attendance
                                </Button>
                                <Button onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Event
                                </Button>
                            </ProtectedComponent>
                        </div>
                    </div>

                    {event.description && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Brief</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MinimalTiptap
                                    content={event.description}
                                    editable={false}
                                    className="border-0"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {event.eventNotes && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-line">{event.eventNotes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {event.attendances && event.attendances.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Attendance ({event.attendances.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Zeus */}
                                {zeusTrooper && (
                                    <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            <span className="font-semibold text-amber-900 dark:text-amber-100">Zeus:</span>
                                            <span className="font-medium">
                                                {zeusTrooper.rank 
                                                    ? getFullTrooperName({ 
                                                        name: zeusTrooper.name, 
                                                        numbers: zeusTrooper.numbers, 
                                                        rank: zeusTrooper.rank 
                                                      }) 
                                                    : zeusTrooper.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Co-Zeus */}
                                {coZeusTroopers.length > 0 && (
                                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <div className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Co-Zeus:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {coZeusTroopers.map((coZeus) => (
                                                <div key={coZeus.id} className="flex items-center gap-2">
                                                    <Crown className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                    <span className="font-medium">
                                                        {coZeus.rank 
                                                            ? getFullTrooperName({ 
                                                                name: coZeus.name, 
                                                                numbers: coZeus.numbers, 
                                                                rank: coZeus.rank 
                                                              }) 
                                                            : coZeus.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Regular Attendees Organized by Unit */}
                                {Object.keys(attendanceByUnit).length > 0 && (
                                    <div className="space-y-4">
                                        {Object.entries(attendanceByUnit)
                                            .sort((a: any, b: any) => {
                                                // Sort by unit priority (lower value = higher priority)
                                                const priorityA = a[1].unitPriority || 999;
                                                const priorityB = b[1].unitPriority || 999;
                                                return priorityA - priorityB;
                                            })
                                            .map(([unitName, unitData]: [string, any]) => (
                                            <div key={unitName} className="border rounded-lg p-4">
                                                <h4 className="font-semibold mb-3 text-lg">{unitName}</h4>
                                                <div className="space-y-2">
                                                    {unitData.attendees.map((att: any) => {
                                                        // Filter out Zeus and Co-Zeus
                                                        const isZeusOrCoZeus = 
                                                            att.trooperId === event.zeusId || 
                                                            event.coZeusIds?.includes(att.trooperId);
                                                        
                                                        if (isZeusOrCoZeus) return null;
                                                        
                                                    return (
                                                        <div key={att.id} className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {getFullTrooperName(att.trooper)}
                                                            </span>
                                                            {att.billetRole && (
                                                                <Badge variant="outline">
                                                                    {att.billetRole}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {event && (
                <ManageAttendanceDialog
                    event={event as CampaignEvent}
                    open={isAttendanceDialogOpen}
                    onOpenChange={setIsAttendanceDialogOpen}
                    onAttendanceUpdated={fetchEvent}
                />
            )}
        </div>
    );
}
