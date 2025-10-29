"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import TiptapEditor from "@/components/tiptap/editor";
import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";
import { EventEntry, TrooperBasicInfo } from "@/lib/types";
import { EventTypes } from "@/db/schema";

interface AttendanceData {
    id: string;
    trooperId: string;
    trooper: TrooperBasicInfo;
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

type EventFormData = {
    id: string;
    name: string;
    description: string;
    eventDate: Date;
    eventTime: string;
    eventType: EventTypes;
    eventNotes: string;
};

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.campaignId as string;
    const eventId = params.eventId as string;

    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState<EventFormData>({
        id: "",
        name: "",
        description: "",
        eventDate: new Date(),
        eventTime: "",
        eventType: "Main",
        eventNotes: "",
    });

    useEffect(() => {
        fetchEvent();
    }, [eventId]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(
                `/api/v1/campaign-events?eventId=${eventId}`
            );
            if (response.ok) {
                const eventData: EventEntry = await response.json();
                setEventData({
                    id: eventData.id,
                    name: eventData.name,
                    description: eventData.description || "",
                    eventDate: new Date(eventData.eventDate),
                    eventTime: eventData.eventTime || "",
                    eventType: eventData.eventType,
                    eventNotes: eventData.eventNotes || "",
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

    const handleUpdate = () => {
        startTransition(async () => {
            try {
                const requestBody = {
                    ...eventData,
                    eventDate: eventData.eventDate.toISOString().split("T")[0],
                    trooperIds: [], // Empty array for now since we're not managing troopers in this edit page
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
                    router.push(`/campaigns/${campaignId}/events/${eventId}`);
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

    if (loading) {
        return (
            <ProtectedRoute
                allowedPermissions={[
                    "Admin",
                    RankLevel.Command,
                    RankLevel.Company,
                ]}
            >
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute
            allowedPermissions={["Admin", RankLevel.Command, RankLevel.Company]}
        >
            <div className="container mx-auto p-6 max-w-5xl">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event
                </Button>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
                    <p className="text-muted-foreground">
                        Update the event details
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Name and Type */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium">
                                Event Name
                            </label>
                            <Input
                                value={eventData.name}
                                onChange={(e) =>
                                    setEventData({
                                        ...eventData,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter event name"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Event Type
                            </label>
                            <Select
                                value={eventData.eventType}
                                onValueChange={(value: any) =>
                                    setEventData({
                                        ...eventData,
                                        eventType: value,
                                    })
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
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
                        </div>
                    </div>

                    {/* Brief */}
                    <div>
                        <label className="text-sm font-medium">Brief</label>
                        <div className="mt-1">
                            <TiptapEditor
                                value={eventData.description}
                                onChange={(html) =>
                                    setEventData({
                                        ...eventData,
                                        description: html,
                                    })
                                }
                                editable={true}
                            />
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium">
                                Event Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full mt-1 pl-3 text-left font-normal",
                                            !eventData.eventDate &&
                                                "text-muted-foreground"
                                        )}
                                    >
                                        {eventData.eventDate ? (
                                            format(eventData.eventDate, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={eventData.eventDate}
                                        onSelect={(date) =>
                                            date &&
                                            setEventData({
                                                ...eventData,
                                                eventDate: date,
                                            })
                                        }
                                        disabled={(date) =>
                                            date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Event Time
                            </label>
                            <div className="relative mt-1">
                                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={eventData.eventTime}
                                    onChange={(e) =>
                                        setEventData({
                                            ...eventData,
                                            eventTime: e.target.value,
                                        })
                                    }
                                    placeholder="HH:MM"
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Format: HH:MM (24-hour)
                            </p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text empathy">Event Notes</label>
                        <Textarea
                            value={eventData.eventNotes}
                            onChange={(e) =>
                                setEventData({
                                    ...eventData,
                                    eventNotes: e.target.value,
                                })
                            }
                            placeholder="Enter event notes"
                            className="mt-1 resize-none"
                        />
                    </div>

                    {/* Update Button */}
                    <div className="flex gap-4 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isPending}>
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Update Event
                        </Button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
