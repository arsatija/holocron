import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
// User is kept for Training section below
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CreateBriefButton from "./_components/create-brief-button";
import EventActions from "./_components/event-actions";
import { getEvent } from "./_lib/queries";

const OPERATION_TYPE_COLORS: Record<string, string> = {
    Main: "bg-blue-600",
    Skirmish: "bg-yellow-600",
    Fun: "bg-green-600",
    Raid: "bg-red-600",
    Joint: "bg-purple-600",
};

const EVENT_KIND_COLORS: Record<string, string> = {
    Operation: "bg-blue-600",
    Training: "bg-orange-500",
    Meeting: "bg-slate-500",
    Social: "bg-pink-600",
};

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;
    const event = await getEvent(eventId);

    if (!event) notFound();

    // Operations with a brief get their own immersive brief page
    if (event.eventKind === "Operation" && event.operationId) {
        redirect(`/events/${eventId}/brief`);
    }

    const effectiveOpType = event.operationType ?? event.seriesOperationType;
    const colorClass =
        event.eventKind === "Operation"
            ? (OPERATION_TYPE_COLORS[effectiveOpType ?? ""] ?? "bg-blue-600")
            : (EVENT_KIND_COLORS[event.eventKind] ?? "bg-slate-500");

    const kindLabel =
        event.eventKind === "Operation" && effectiveOpType
            ? effectiveOpType
            : event.eventKind;

    const isTBD = event.eventKind === "Operation" && !event.operationId;

    const title = isTBD
        ? "TBD"
        : event.operationName ?? event.name;

    const formattedDate = format(parseLocalDate(event.eventDate), "EEEE, MMMM d, yyyy");

    const timeDisplay = (() => {
        if (!event.eventTime) return null;
        if (event.eventKind === "Training" && event.eventEndTime) {
            return `${event.eventTime} – ${event.eventEndTime} EST`;
        }
        return `${event.eventTime} EST`;
    })();

    return (
        <div className="bg-background">
            {/* Colored top stripe */}
            <div className={`h-1.5 w-full ${colorClass}`} />

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Back link */}
                <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Events
                </Link>

                {/* Header: title/meta on left, actions on right */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0 flex-1">
                        {/* Kind badge + status badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${colorClass}`}>
                                {kindLabel}
                            </span>
                            {isTBD && (
                                <Badge variant="outline" className="text-muted-foreground text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    No Brief
                                </Badge>
                            )}
                            {event.eventKind === "Training" && !!event.trainingCompletionId && (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completed
                                </Badge>
                            )}
                            {event.eventKind === "Operation" && !!event.attendanceId && (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Logged
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className={`text-3xl font-extrabold tracking-tight mb-1 ${isTBD ? "text-muted-foreground italic" : ""}`}>
                            {title}
                        </h1>

                        {/* Campaign / series */}
                        {event.campaignName && (
                            <p className="text-sm text-muted-foreground mb-1">{event.campaignName}</p>
                        )}
                        {event.seriesName && !event.campaignName && (
                            <p className="text-sm text-muted-foreground mb-1">Series: {event.seriesName}</p>
                        )}

                        {/* Date + time */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                {formattedDate}
                            </span>
                            {timeDisplay && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {timeDisplay}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions — top right */}
                    <EventActions eventId={event.id} eventKind={event.eventKind} />
                </div>

                {/* Description */}
                {event.description && (
                    <>
                        <Separator className="mb-4" />
                        <p className="text-sm text-foreground whitespace-pre-wrap mb-6">{event.description}</p>
                    </>
                )}

                {/* Banner image */}
                {event.bannerImage && (
                    <img
                        src={event.bannerImage}
                        alt={event.name}
                        className="rounded-md w-full object-cover max-h-64 mb-6"
                    />
                )}

                {/* TBD notice */}
                {isTBD && (
                    <>
                        <Separator className="mb-4" />
                        <div className="text-center space-y-4 py-2">
                            <p className="text-sm text-muted-foreground">
                                No operation brief has been filed for this event yet.
                            </p>
                            <CreateBriefButton
                                eventId={event.id}
                                seriesOperationType={event.seriesOperationType}
                            />
                        </div>
                    </>
                )}

                {/* Training details */}
                {event.eventKind === "Training" && (
                    <>
                        <Separator className="mb-4" />
                        <div className="space-y-3 text-sm">
                            {event.qualificationName && (
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Qualification</p>
                                    <p className="font-medium">
                                        {event.qualificationAbbreviation} — {event.qualificationName}
                                    </p>
                                </div>
                            )}
                            {event.trainerName && (
                                <div className="flex items-start gap-2">
                                    <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trainer</p>
                                        <p className="font-medium">
                                            {event.trainerNumbers} {event.trainerName}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
