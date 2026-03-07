"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPast } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

interface LogAttendanceButtonProps {
    eventId: string;
    eventDate: string;
    eventTime: string | null;
    attendanceId: string | null;
}

export default function LogAttendanceButton({ eventId, eventDate, eventTime, attendanceId }: LogAttendanceButtonProps) {
    const { trooperCtx } = useController();

    const canLog = checkPermissionsSync(trooperCtx, ["Attendance", "Admin", RankLevel.Command]);

    const eventStart = parseLocalDate(eventDate);
    if (eventTime) {
        const [h, m] = eventTime.split(":").map(Number);
        eventStart.setHours(h, m, 0, 0);
    }
    const isPastDate = isPast(eventStart);

    if (!canLog || !isPastDate) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            asChild
        >
            <Link href={`/events/${eventId}/attendance`}>
                <Users className="h-4 w-4 mr-1.5" />
                {attendanceId ? "Update Attendance" : "Log Attendance"}
            </Link>
        </Button>
    );
}
