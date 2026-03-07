import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getEvent } from "../_lib/queries";
import AttendanceForm from "./_components/attendance-form";

export default async function AttendancePage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = await params;
    const event = await getEvent(eventId);

    if (!event || event.eventKind !== "Operation") notFound();

    const returnUrl = event.operationId
        ? `/events/${eventId}/brief`
        : `/events/${eventId}`;

    const title = event.attendanceId ? "Update Attendance" : "Log Attendance";
    const opLabel = event.operationName ?? event.name;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Link
                href={returnUrl}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Brief
            </Link>

            <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6" />
                <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{opLabel}</p>

            <Separator className="mb-8" />

            <AttendanceForm
                eventId={eventId}
                attendanceId={event.attendanceId ?? null}
                returnUrl={returnUrl}
            />
        </div>
    );
}
