export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getEvent } from "../_lib/queries";
import { BriefDisplay, type BriefData } from "./_components/brief-display";

export default async function BriefPage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;
    const event = await getEvent(eventId);

    if (!event) notFound();
    if (event.eventKind !== "Operation" || !event.operationId) {
        redirect(`/events/${eventId}`);
    }

    const effectiveOpType = event.operationType ?? event.seriesOperationType ?? "Main";

    const data: BriefData = {
        eventId,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        campaignName: event.campaignName ?? null,
        seriesName: event.seriesName ?? null,
        attendanceId: event.attendanceId ?? null,
        operationType: effectiveOpType,
        operationName: event.operationName ?? null,
        transmittedByName: event.transmittedByName ?? null,
        transmittedByNumbers: event.transmittedByNumbers ?? null,
        situationReport: event.situationReport ?? null,
        objectives: event.objectives ?? null,
        deployedForces: event.deployedForces ?? null,
        eventNotes: event.eventNotes ?? null,
    };

    return <BriefDisplay data={data} eventId={eventId} />;
}
