"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2 } from "lucide-react";
import { format, isPast } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { useState } from "react";
import CompleteTrainingDialog from "./complete-training-dialog";

export type EventRow = {
    // Base event fields
    id: string;
    name: string;
    description: string | null;
    eventDate: string;
    eventTime: string | null;
    eventEndTime: string | null;
    eventKind: "Operation" | "Training" | "Meeting" | "Social";
    campaignId: string | null;
    campaignName: string | null;
    bannerImage: string | null;
    seriesId: string | null;
    seriesName: string | null;
    seriesOperationType: string | null;
    // Operation fields (null for Training/Meeting, or if no brief yet)
    operationId: string | null;
    operationType: string | null;
    operationName: string | null;
    transmittedById: string | null;
    transmittedByName: string | null;
    transmittedByNumbers: number | null;
    transmittedByRank: number | null;
    deployedForces: string[] | null;
    objectives: Array<{ title: string; description: string }> | null;
    situationReport: string | null;
    eventNotes: string | null;
    attendanceId: string | null; // from operations table
    // Training fields (null for Operation/Meeting)
    trainingEventId: string | null;
    qualificationId: string | null;
    qualificationName: string | null;
    qualificationAbbreviation: string | null;
    scheduledTrainerId: string | null;
    trainerName: string | null;
    trainerNumbers: number | null;
    trainerRank: number | null;
    trainingCompletionId: string | null;
};

const eventKindColors: Record<string, string> = {
    Operation: "bg-blue-600 text-white",
    Training: "bg-orange-600 text-white",
    Meeting: "bg-slate-600 text-white",
    Social: "bg-pink-600 text-white",
};

const operationTypeColors: Record<string, string> = {
    Main: "bg-blue-600 text-white",
    Skirmish: "bg-yellow-600 text-white",
    Fun: "bg-green-600 text-white",
    Raid: "bg-red-600 text-white",
    Joint: "bg-purple-600 text-white",
    Social: "bg-pink-600 text-white",
};

interface EventCardProps {
    event: EventRow;
    canComplete: boolean;
    onCompleted: () => void;
}

export default function EventCard({
    event,
    canComplete,
    onCompleted,
}: EventCardProps) {
    const [completeOpen, setCompleteOpen] = useState(false);

    const isPastDate = isPast(parseLocalDate(event.eventDate + "T23:59:59"));
    const isTrainingCompleted = event.eventKind === "Training" && !!event.trainingCompletionId;
    const showCompleteButton =
        canComplete &&
        event.eventKind === "Training" &&
        !isTrainingCompleted &&
        isPastDate;

    const formattedDate = format(parseLocalDate(event.eventDate), "EEE, MMM d, yyyy");

    // Badge color — use operationType for Operations, kind color otherwise
    const badgeColor =
        event.eventKind === "Operation" && event.operationType
            ? (operationTypeColors[event.operationType] ?? eventKindColors["Operation"])
            : (eventKindColors[event.eventKind] ?? "bg-muted text-muted-foreground");

    const badgeLabel =
        event.eventKind === "Operation" && event.operationType
            ? event.operationType
            : event.eventKind;

    return (
        <>
            <Card className="border border-border bg-card">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}
                                >
                                    {badgeLabel}
                                </span>
                                {isTrainingCompleted && (
                                    <Badge
                                        variant="outline"
                                        className="text-green-600 border-green-600 text-xs"
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Completed
                                    </Badge>
                                )}
                                {event.eventKind === "Operation" && event.attendanceId && (
                                    <Badge
                                        variant="outline"
                                        className="text-green-600 border-green-600 text-xs"
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Logged
                                    </Badge>
                                )}
                            </div>
                            <p className="font-semibold text-sm truncate">
                                {event.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {event.campaignName ?? "Standalone"}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                <span>{formattedDate}</span>
                                {event.eventTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {event.eventTime} EST
                                    </span>
                                )}
                            </div>
                            {event.eventKind === "Training" ? (
                                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                                    {event.qualificationName && (
                                        <p>
                                            Qualification:{" "}
                                            <span className="text-foreground font-medium">
                                                {event.qualificationAbbreviation}{" "}
                                                — {event.qualificationName}
                                            </span>
                                        </p>
                                    )}
                                    {event.trainerName && (
                                        <p>
                                            Trainer:{" "}
                                            <span className="text-foreground font-medium">
                                                {event.trainerNumbers} {event.trainerName}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            ) : event.eventKind === "Operation" ? (
                                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                                    {event.transmittedByName && (
                                        <p>
                                            Zeus:{" "}
                                            <span className="text-foreground font-medium">
                                                {event.transmittedByNumbers} {event.transmittedByName}
                                            </span>
                                        </p>
                                    )}
                                    {event.objectives && event.objectives.length > 0 && (
                                        <div>
                                            <span className="font-medium">Objectives:</span>
                                            <ol className="list-decimal list-inside mt-0.5 space-y-0.5">
                                                {event.objectives.slice(0, 2).map((obj, i) => (
                                                    <li key={i} className="truncate">
                                                        <span className="font-medium">{obj.title}</span>
                                                        {obj.description && ` — ${obj.description}`}
                                                    </li>
                                                ))}
                                                {event.objectives.length > 2 && (
                                                    <li className="text-muted-foreground">
                                                        +{event.objectives.length - 2} more
                                                    </li>
                                                )}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                        {showCompleteButton && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => setCompleteOpen(true)}
                            >
                                Complete Training
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {event.eventKind === "Training" && (
                <CompleteTrainingDialog
                    event={event}
                    open={completeOpen}
                    onOpenChange={setCompleteOpen}
                    onCompleted={onCompleted}
                />
            )}
        </>
    );
}
