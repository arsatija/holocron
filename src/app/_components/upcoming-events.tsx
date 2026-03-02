import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { getUpcomingEvents } from "@/services/homepage";
import { EventKind } from "@/db/schema";
import { parseLocalDate } from "@/lib/utils";

const eventKindBadgeVariant: Record<
    EventKind,
    "default" | "secondary" | "training" | "operation" | "meeting" | "social"
> = {
    Operation: "operation",
    Training: "training",
    Meeting: "meeting",
    Social: "social",
};

function formatEventDate(dateStr: string): string {
    const d = parseLocalDate(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM dd, yyyy");
}

export default async function UpcomingEvents() {
    const events = await getUpcomingEvents();

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Events
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No upcoming events scheduled.
                    </p>
                ) : (
                    events.map((event) => (
                        <div
                            key={event.id}
                            className="rounded-lg border border-border bg-card p-4 space-y-3"
                        >
                            {/* Name + badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-bold leading-tight">
                                    {event.name}
                                </span>
                                <Badge variant={eventKindBadgeVariant[event.eventKind] ?? "default"} className="text-xs">
                                    {event.eventKind}
                                </Badge>
                            </div>

                            {event.eventKind == "Operation" && event.operation?.operationName ? (
                                <p className="text-sm text-muted-foreground leading-snug -mt-1">
                                    {event.operation.operationName}
                                </p>
                            ) : (
                                <>
                                    {/* Description */}
                                    {event.description && (
                                        <p className="text-sm text-muted-foreground leading-snug -mt-1">
                                            {event.description}
                                        </p>
                                    )}
                                </>
                            )}

                            {/* Date + time row */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatEventDate(event.eventDate)}
                                </span>
                                {event.eventTime && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {event.eventTime} EST
                                    </span>
                                )}
                            </div>

                            {/* View Details button */}
                            <Link
                                href={`/events/${event.id}`}
                                className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-foreground border border-border rounded-md hover:bg-accent transition-colors"
                            >
                                View Details
                            </Link>
                        </div>
                    ))
                )}

                <Link
                    href="/events"
                    className="block text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                    View all events →
                </Link>
            </CardContent>
        </Card>
    );
}
