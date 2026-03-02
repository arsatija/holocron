"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isPast, format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { CheckCircle2, Clock, CalendarDays, User, FilePlus, FileText, AlertCircle, Pencil } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EventRow } from "./event-card";
import CompleteTrainingDialog from "./complete-training-dialog";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

// Color maps
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

function getEventColor(event: EventRow): string {
    if (event.eventKind === "Operation") {
        const opType = event.operationType ?? event.seriesOperationType;
        if (opType) return OPERATION_TYPE_COLORS[opType] ?? "bg-blue-600";
        return "bg-blue-600";
    }
    return EVENT_KIND_COLORS[event.eventKind] ?? "bg-slate-500";
}

interface EventDetailSheetProps {
    event: EventRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCompleted: () => void;
}

export default function EventDetailSheet({
    event,
    open,
    onOpenChange,
    onCompleted,
}: EventDetailSheetProps) {
    const router = useRouter();
    const [completeOpen, setCompleteOpen] = useState(false);
    const { trooperCtx } = useController();

    const canComplete = checkPermissionsSync(trooperCtx, [
        "Training",
        RankLevel.Company,
        RankLevel.Command,
    ]);

    const canManageBrief = checkPermissionsSync(trooperCtx, [
        "Zeus",
        "Admin",
        RankLevel.Command,
    ]);

    const canEditEvent = checkPermissionsSync(trooperCtx, [
        "Zeus",
        "Admin",
        RankLevel.Command,
    ]);

    const canEditTraining = checkPermissionsSync(trooperCtx, [
        "Training",
        "Zeus",
        "Admin",
        RankLevel.Command,
    ]);

    if (!event) return null;

    const isPastDate = isPast(parseLocalDate(event.eventDate + "T23:59:59"));
    const isTrainingCompleted = event.eventKind === "Training" && !!event.trainingCompletionId;
    const showCompleteButton =
        canComplete &&
        event.eventKind === "Training" &&
        !isTrainingCompleted &&
        isPastDate;

    // Operation-specific state
    const hasBrief = event.eventKind === "Operation" && !!event.operationId;
    const isSeriesEvent = event.eventKind === "Operation" && !!event.seriesId;
    const isTBD = event.eventKind === "Operation" && !event.operationId;

    const colorClass = getEventColor(event);
    const formattedDate = format(parseLocalDate(event.eventDate), "EEEE, MMMM d, yyyy");

    const effectiveOpType = event.operationType ?? event.seriesOperationType;
    const kindLabel =
        event.eventKind === "Operation" && effectiveOpType
            ? effectiveOpType
            : event.eventKind;

    // Operation name / subtext
    const opSubtext = (() => {
        if (event.eventKind !== "Operation") return null;
        if (event.operationName) return event.operationName;
        if (effectiveOpType !== "Main" && event.transmittedByName) {
            return null; // Zeus section handles this
        }
        if (isTBD) return "No brief yet";
        return null;
    })();

    function handleCompleted() {
        setCompleteOpen(false);
        onCompleted();
        onOpenChange(false);
    }

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="sm:max-w-md flex flex-col p-0 overflow-y-auto">
                    {/* Colored top stripe */}
                    <div className={`h-1.5 w-full shrink-0 ${colorClass}`} />

                    <div className="flex flex-col flex-1 p-6 gap-4">
                        <SheetHeader className="p-0">
                            {/* Kind + badges */}
                            <div className="flex flex-wrap gap-2 mb-1">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${colorClass}`}>
                                    {kindLabel}
                                </span>
                                {isTBD && (
                                    <Badge variant="outline" className="text-muted-foreground text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        No Brief
                                    </Badge>
                                )}
                                {isTrainingCompleted && (
                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Completed
                                    </Badge>
                                )}
                                {event.eventKind === "Operation" && event.attendanceId && (
                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Logged
                                    </Badge>
                                )}
                            </div>

                            <SheetTitle className="text-xl font-bold leading-tight">
                                {isTBD ? (
                                    <span className="text-muted-foreground italic">TBD</span>
                                ) : event.operationName ? (
                                    event.operationName
                                ) : (
                                    event.name
                                )}
                            </SheetTitle>

                            {event.campaignName && (
                                <p className="text-sm text-muted-foreground">{event.campaignName}</p>
                            )}
                            {event.seriesName && !event.campaignName && (
                                <p className="text-sm text-muted-foreground">Series: {event.seriesName}</p>
                            )}
                        </SheetHeader>

                        {/* Date + time */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                {formattedDate}
                            </span>
                            {event.eventTime && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {event.eventKind === "Training" && event.eventEndTime
                                        ? `${event.eventTime} – ${event.eventEndTime} EST`
                                        : `${event.eventTime} EST`}
                                </span>
                            )}
                        </div>

                        {/* Edit Event button */}
                        {(canEditEvent || (event.eventKind === "Training" && canEditTraining)) && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => router.push(`/events/${event.id}/edit`)}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Event
                            </Button>
                        )}

                        {/* TBD state: prompt to create brief */}
                        {isTBD && canManageBrief && (
                            <>
                                <Separator />
                                <div className="text-center space-y-3 py-2">
                                    <p className="text-sm text-muted-foreground">
                                        No operation brief has been filed for this event yet.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.push(`/events/${event.id}`)}
                                    >
                                        <FilePlus className="h-4 w-4 mr-2" />
                                        Create Brief
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Description */}
                        {event.description && (
                            <>
                                <Separator />
                                <p className="text-sm text-foreground whitespace-pre-wrap">{event.description}</p>
                            </>
                        )}

                        {/* Banner image */}
                        {event.bannerImage && (
                            <img
                                src={event.bannerImage}
                                alt={event.name}
                                className="rounded-md w-full object-cover max-h-48"
                            />
                        )}

                        {/* View Brief button */}
                        {hasBrief && (
                            <>
                                <Separator />
                                {event.transmittedByName && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Zeus</p>
                                            <p className="font-medium">
                                                {event.transmittedByNumbers} {event.transmittedByName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <Button
                                    variant="holo"
                                    className="w-full"
                                    onClick={() => router.push(`/events/${event.id}/brief`)}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Brief
                                </Button>
                            </>
                        )}

                        {/* Training details */}
                        {event.eventKind === "Training" && (
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
                        )}

                        {/* Footer: Complete Training */}
                        {showCompleteButton && (
                            <>
                                <Separator />
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setCompleteOpen(true)}
                                >
                                    Complete Training
                                </Button>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {event.eventKind === "Training" && (
                <CompleteTrainingDialog
                    event={event}
                    open={completeOpen}
                    onOpenChange={setCompleteOpen}
                    onCompleted={handleCompleted}
                />
            )}

        </>
    );
}
