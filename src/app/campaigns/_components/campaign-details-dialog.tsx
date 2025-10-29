"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    Plus,
    Edit,
    Trash2,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Campaign, CampaignEvent } from "@/db/schema";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";
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
import { toast } from "sonner";

interface CampaignDetailsDialogProps {
    campaign: Campaign | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCampaignUpdated: () => void;
}

export default function CampaignDetailsDialog({
    campaign,
    open,
    onOpenChange,
    onCampaignUpdated,
}: CampaignDetailsDialogProps) {
    const router = useRouter();
    const [events, setEvents] = useState<CampaignEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);

    const fetchEvents = async () => {
        if (!campaign) return;

        setLoading(true);
        try {
            const response = await fetch(
                `/api/v1/campaign-events?campaignId=${campaign.id}`
            );
            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && campaign) {
            fetchEvents();
        }
    }, [open, campaign]);

    const handleCreateEvent = () => {
        if (!campaign) return;
        router.push(`/campaigns/${campaign.id}/events/new`);
    };

    const handleEditEvent = (eventId: string) => {
        if (!campaign) return;
        router.push(`/campaigns/${campaign.id}/events/${eventId}`);
    };

    const handleDeleteEvent = async (eventId: string) => {
        setEventToDelete(eventId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;

        try {
            const response = await fetch(
                `/api/v1/campaign-events?eventId=${eventToDelete}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                toast.success("Event deleted successfully");
                setDeleteDialogOpen(false);
                setEventToDelete(null);
                fetchEvents();
            } else {
                toast.error("Failed to delete event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("Failed to delete event");
        }
    };

    const handleEditCampaign = () => {
        if (!campaign) return;
        router.push(`/campaigns/${campaign.id}/edit`);
    };

    if (!campaign) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-end justify-between">
                            <div>
                                <DialogTitle className="text-2xl">
                                    {campaign.name}
                                </DialogTitle>
                                <DialogDescription>
                                    {campaign.description ||
                                        "No description provided"}
                                </DialogDescription>
                            </div>
                            <ProtectedComponent
                                allowedPermissions={[
                                    "Admin",
                                    RankLevel.Command,
                                    RankLevel.Company,
                                ]}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleEditCampaign}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Campaign
                                </Button>
                            </ProtectedComponent>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Campaign Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Duration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        <div>
                                            Start:{" "}
                                            {format(
                                                new Date(campaign.startDate),
                                                "MMM dd, yyyy"
                                            )}
                                        </div>
                                        {campaign.endDate && (
                                            <div>
                                                End:{" "}
                                                {format(
                                                    new Date(campaign.endDate),
                                                    "MMM dd, yyyy"
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Events
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {events.length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Total events
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge
                                        variant={
                                            campaign.isActive
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {campaign.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </Badge>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Events Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    Events
                                </h3>
                                <ProtectedComponent
                                    allowedPermissions={[
                                        "Admin",
                                        RankLevel.Command,
                                        RankLevel.Company,
                                    ]}
                                >
                                    <Button onClick={handleCreateEvent}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Event
                                    </Button>
                                </ProtectedComponent>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <Card key={i} className="animate-pulse">
                                            <CardHeader>
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : events.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">
                                            No events yet
                                        </h3>
                                        <p className="text-muted-foreground text-center mb-4">
                                            Add events to this campaign to start
                                            tracking attendance.
                                        </p>
                                        <ProtectedComponent
                                            allowedPermissions={[
                                                "Admin",
                                                RankLevel.Command,
                                                RankLevel.Company,
                                            ]}
                                        >
                                            <Button onClick={handleCreateEvent}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Event
                                            </Button>
                                        </ProtectedComponent>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {events.map((event) => (
                                        <Card
                                            key={event.id}
                                            className="cursor-pointer hover:bg-accent transition-colors"
                                            onClick={() =>
                                                router.push(
                                                    `/campaigns/${campaign.id}/events/${event.id}`
                                                )
                                            }
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {event.name}
                                                        </CardTitle>
                                                        <CardDescription className="flex items-center gap-4 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                {format(
                                                                    new Date(
                                                                        event.eventDate
                                                                    ),
                                                                    "MMM dd, yyyy"
                                                                )}
                                                            </span>
                                                            {event.eventTime && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-4 w-4" />
                                                                    {
                                                                        event.eventTime
                                                                    }
                                                                </span>
                                                            )}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            {event.eventType}
                                                        </Badge>
                                                        <ProtectedComponent
                                                            allowedPermissions={[
                                                                "Admin",
                                                                RankLevel.Command,
                                                                RankLevel.Company,
                                                            ]}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleEditEvent(
                                                                        event.id
                                                                    );
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteEvent(
                                                                        event.id
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </ProtectedComponent>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {event.eventNotes && (
                                                    <div className="bg-muted p-3 rounded-md">
                                                        <p className="text-sm font-medium mb-1">
                                                            Notes:
                                                        </p>
                                                        <p className="text-sm">
                                                            {event.eventNotes}
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <AlertDialog
                        open={deleteDialogOpen}
                        onOpenChange={(open) => {
                            if (!open) {
                                setDeleteDialogOpen(false);
                                setEventToDelete(null);
                            }
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete this event and remove its
                                    data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteDialogOpen(false);
                                        setEventToDelete(null);
                                    }}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={confirmDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogContent>
            </Dialog>
        </>
    );
}
