"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isPast } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CompleteTrainingDialog from "@/app/events/_components/complete-training-dialog";
import type { EventRow } from "@/app/events/_components/event-card";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

interface TrainingActionsProps {
    eventId: string;
    eventDate: string;
    eventTime: string | null;
    eventName: string;
    trainingCompletionId: string | null;
}

export default function TrainingActions({
    eventId,
    eventDate,
    eventTime,
    eventName,
    trainingCompletionId,
}: TrainingActionsProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { trooperCtx } = useController();

    const canComplete = checkPermissionsSync(trooperCtx, [
        "Training",
        RankLevel.Company,
        RankLevel.Command,
    ]);

    const eventStart = parseLocalDate(eventDate);
    if (eventTime) {
        const [h, m] = eventTime.split(":").map(Number);
        eventStart.setHours(h, m, 0, 0);
    }
    const isPastDate = isPast(eventStart);

    if (!canComplete || !!trainingCompletionId || !isPastDate) return null;

    // Minimal shape required by CompleteTrainingDialog
    const eventRow = { id: eventId, name: eventName, eventKind: "Training" } as EventRow;

    return (
        <>
            <Separator className="mb-4" />
            <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
                Complete Training
            </Button>
            <CompleteTrainingDialog
                event={eventRow}
                open={open}
                onOpenChange={setOpen}
                onCompleted={() => router.refresh()}
            />
        </>
    );
}
