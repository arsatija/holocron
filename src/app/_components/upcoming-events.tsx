import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { getUpcomingEvents } from "@/services/homepage";
import { EventTypes } from "@/db/schema";

const eventTypeBadgeVariant: Record<
    EventTypes,
    "default" | "secondary" | "outline" | "destructive"
> = {
    Main: "default",
    Skirmish: "secondary",
    Fun: "outline",
    Raid: "destructive",
    Joint: "secondary",
};

function formatEventDate(dateStr: string): string {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
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
            <CardContent className="space-y-0">
                {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No upcoming events scheduled.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {events.map((event) => (
                            <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {event.name}
                                        </p>
                                        {event.campaign && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {event.campaign.name}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                            <span>{formatEventDate(event.eventDate)}</span>
                                            {event.eventTime && (
                                                <>
                                                    <Clock className="h-3 w-3" />
                                                    <span>{event.eventTime} UTC</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            eventTypeBadgeVariant[event.eventType] ??
                                            "outline"
                                        }
                                        className="shrink-0 text-xs"
                                    >
                                        {event.eventType}
                                    </Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="pt-3 border-t border-border mt-1">
                    <Link
                        href="/campaigns"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        View all campaigns →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
