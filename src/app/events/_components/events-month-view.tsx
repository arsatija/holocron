"use client";

import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isToday,
    isSameDay,
} from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EventRow } from "./event-card";

const OPERATION_TYPE_BG: Record<string, string> = {
    Main: "bg-blue-600 hover:bg-blue-700",
    Skirmish: "bg-yellow-600 hover:bg-yellow-700",
    Fun: "bg-green-600 hover:bg-green-700",
    Raid: "bg-red-600 hover:bg-red-700",
    Joint: "bg-purple-600 hover:bg-purple-700",
};

const EVENT_KIND_BG: Record<string, string> = {
    Operation: "bg-blue-600 hover:bg-blue-700",
    Training: "bg-orange-500 hover:bg-orange-600",
    Meeting: "bg-slate-500 hover:bg-slate-600",
    Social: "bg-pink-600 hover:bg-pink-700",
};

export function getMonthEventBg(event: EventRow): string {
    if (event.eventKind === "Operation") {
        const opType = event.operationType ?? event.seriesOperationType;
        if (opType) return OPERATION_TYPE_BG[opType] ?? "bg-blue-600 hover:bg-blue-700";
        return "bg-blue-600 hover:bg-blue-700";
    }
    return EVENT_KIND_BG[event.eventKind] ?? "bg-slate-500 hover:bg-slate-600";
}

function getBlockTypeLabel(event: EventRow): string {
    if (event.eventKind === "Operation") {
        const opType = event.operationType ?? event.seriesOperationType ?? "Main";
        const labels: Record<string, string> = {
            Main: "Main Op",
            Skirmish: "Skirmish",
            Fun: "Fun Op",
            Raid: "Raid",
            Joint: "Joint Op",
        };
        return labels[opType] ?? opType;
    }
    return event.eventKind;
}

function getBlockSubtext(event: EventRow): string {
    if (event.eventKind === "Operation") {
        if (event.operationName) return event.operationName;
        const opType = event.operationType ?? event.seriesOperationType ?? "Main";
        if (opType !== "Main" && event.transmittedByName) return event.transmittedByName;
        return "TBD";
    }
    return event.name;
}

const MAX_VISIBLE = 3;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface EventsMonthViewProps {
    currentMonth: Date;
    events: EventRow[];
    onEventClick: (event: EventRow) => void;
    isLoading: boolean;
}

export default function EventsMonthView({
    currentMonth,
    events,
    onEventClick,
    isLoading,
}: EventsMonthViewProps) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let curr = gridStart;
    while (curr <= gridEnd) {
        days.push(curr);
        curr = addDays(curr, 1);
    }

    function getEventsForDay(date: Date): EventRow[] {
        return events
            .filter((e) => isSameDay(parseLocalDate(e.eventDate), date))
            .sort((a, b) => {
                if (!a.eventTime && !b.eventTime) return 0;
                if (!a.eventTime) return 1;
                if (!b.eventTime) return -1;
                return a.eventTime.localeCompare(b.eventTime);
            });
    }

    return (
        <div className={cn("flex-1 flex flex-col overflow-hidden", isLoading && "opacity-50 pointer-events-none")}>
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-border shrink-0">
                {DAY_NAMES.map((d) => (
                    <div
                        key={d}
                        className="py-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0 border-border"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="flex-1 overflow-y-auto">
                <div
                    className="grid grid-cols-7"
                    style={{ gridAutoRows: "minmax(110px, 1fr)" }}
                >
                    {days.map((day, i) => {
                        const dayEvents = getEventsForDay(day);
                        const inMonth = isSameMonth(day, currentMonth);
                        const today = isToday(day);
                        const visible = dayEvents.slice(0, MAX_VISIBLE);
                        const overflow = dayEvents.length - MAX_VISIBLE;

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "border-b border-r border-border p-1",
                                    !inMonth && "bg-muted/10",
                                    today && "bg-muted/20"
                                )}
                            >
                                {/* Day number */}
                                <div className="flex justify-end mb-1">
                                    <div
                                        className={cn(
                                            "w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold",
                                            today
                                                ? "bg-red-500 text-white"
                                                : inMonth
                                                ? "text-foreground"
                                                : "text-muted-foreground/40"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </div>
                                </div>

                                {/* Events */}
                                <div className="space-y-0.5">
                                    {visible.map((e) => (
                                        <button
                                            key={e.id}
                                            onClick={() => onEventClick(e)}
                                            className={cn(
                                                "w-full text-left text-[10px] text-white rounded px-1.5 py-0.5 truncate transition-opacity",
                                                getMonthEventBg(e)
                                            )}
                                        >
                                            {e.eventTime && (
                                                <span className="opacity-70 mr-1">{e.eventTime}</span>
                                            )}
                                            <span className="font-semibold">{getBlockTypeLabel(e)}</span>
                                            {" · "}
                                            <span className="opacity-80">{getBlockSubtext(e)}</span>
                                        </button>
                                    ))}
                                    {overflow > 0 && (
                                        <p className="text-[10px] text-muted-foreground px-1">
                                            +{overflow} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
