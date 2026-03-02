"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    format,
    isSameDay,
    isToday,
} from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Loader2, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventRow } from "./event-card";
import EventDetailSheet from "./event-detail-sheet";
import EventsMonthView from "./events-month-view";
import ManageSeriesSheet from "./manage-series-sheet";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PX_PER_MINUTE = 1.5;
const TOTAL_HEIGHT = 1440 * PX_PER_MINUTE; // 2160px

const EVENT_DURATION: Record<string, number> = {
    Operation: 180,
    Training: 90,
    Meeting: 60,
    Social: 120,
};

// ─── Color maps ───────────────────────────────────────────────────────────────

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

function getEventBg(event: EventRow): string {
    if (event.eventKind === "Operation") {
        const opType = event.operationType ?? event.seriesOperationType;
        if (opType) return OPERATION_TYPE_BG[opType] ?? "bg-blue-600 hover:bg-blue-700";
        return "bg-blue-600 hover:bg-blue-700";
    }
    return EVENT_KIND_BG[event.eventKind] ?? "bg-slate-500 hover:bg-slate-600";
}

/** Bold type label at top of block */
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

/** Muted subtext below the label */
function getBlockSubtext(event: EventRow): string {
    if (event.eventKind === "Operation") {
        if (event.operationName) return event.operationName;
        const opType = event.operationType ?? event.seriesOperationType ?? "Main";
        // For non-main types: show Zeus name as subtext if available
        if (opType !== "Main" && event.transmittedByName) {
            return event.transmittedByName;
        }
        return "TBD";
    }
    return event.name;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + (m || 0);
}

function formatWeekRange(weekStart: Date): string {
    const weekEnd = addDays(weekStart, 6);
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    if (sameMonth) {
        return `${format(weekStart, "MMMM d")} – ${format(weekEnd, "d, yyyy")}`;
    }
    return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
}

// ─── Lane algorithm ──────────────────────────────────────────────────────────

interface LanedEvent {
    event: EventRow;
    lane: number;
    totalLanes: number;
    topPx: number;
    heightPx: number;
}

function layoutDayEvents(dayEvents: EventRow[]): LanedEvent[] {
    const timed = dayEvents.filter((e) => !!e.eventTime);
    if (timed.length === 0) return [];

    const withPos = timed.map((e) => {
        const startMin = timeToMinutes(e.eventTime!);
        const duration =
            e.eventKind === "Training" && e.eventEndTime
                ? Math.max(15, timeToMinutes(e.eventEndTime) - startMin)
                : (EVENT_DURATION[e.eventKind] ?? 60);
        const topPx = startMin * PX_PER_MINUTE;
        const rawHeight = duration * PX_PER_MINUTE;
        const heightPx = Math.max(22, Math.min(rawHeight, TOTAL_HEIGHT - topPx));
        return { event: e, startMin, endMin: startMin + duration, topPx, heightPx };
    });

    withPos.sort((a, b) => a.startMin - b.startMin);

    const lanes: number[] = new Array(withPos.length).fill(0);
    const endMinByLane: number[] = [];

    for (let i = 0; i < withPos.length; i++) {
        let lane = 0;
        while (endMinByLane[lane] !== undefined && endMinByLane[lane] > withPos[i].startMin) {
            lane++;
        }
        lanes[i] = lane;
        endMinByLane[lane] = withPos[i].endMin;
    }

    const totalLanes = Math.max(...lanes) + 1;

    return withPos.map((p, i) => ({
        event: p.event,
        lane: lanes[i],
        totalLanes,
        topPx: p.topPx,
        heightPx: p.heightPx,
    }));
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarView = "week" | "month";

interface EventsCalendarProps {
    initialWeekStart: string; // YYYY-MM-DD Sunday
    initialEvents: EventRow[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EventsCalendar({
    initialWeekStart,
    initialEvents,
}: EventsCalendarProps) {
    const router = useRouter();
    const { trooperCtx } = useController();
    const gridRef = useRef<HTMLDivElement>(null);

    const [view, setView] = useState<CalendarView>("month");
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
        parseLocalDate(initialWeekStart)
    );
    const [currentMonth, setCurrentMonth] = useState<Date>(
        startOfMonth(parseLocalDate(initialWeekStart))
    );
    const [events, setEvents] = useState<EventRow[]>(initialEvents);
    const [isLoading, setIsLoading] = useState(false);
    const [nowMinutes, setNowMinutes] = useState<number>(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [seriesSheetOpen, setSeriesSheetOpen] = useState(false);

    const canCreate = checkPermissionsSync(trooperCtx, [
        "Zeus",
        "Training",
        "Admin",
        RankLevel.JNCO,
        RankLevel.SNCO,
        RankLevel.Company,
        RankLevel.Command,
    ]);

    const canManageSeries = checkPermissionsSync(trooperCtx, [
        "Admin",
        RankLevel.Command,
    ]);

    // ─── Fetch helper ───────────────────────────────────────────────────────
    const fetchEvents = useCallback(async (from: string, to: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/events?from=${from}&to=${to}`);
            if (res.ok) {
                const data: EventRow[] = await res.json();
                setEvents(data);
            }
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ─── Auto-scroll on mount (week view) ──────────────────────────────────
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.scrollTop = Math.max(0, nowMinutes * PX_PER_MINUTE - 200);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Current-time line updater ──────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setNowMinutes(now.getHours() * 60 + now.getMinutes());
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    // ─── Navigation ─────────────────────────────────────────────────────────
    const navigate = useCallback(
        async (delta: 1 | -1) => {
            if (view === "week") {
                const newWeekStart = delta === 1
                    ? addWeeks(currentWeekStart, 1)
                    : subWeeks(currentWeekStart, 1);
                setCurrentWeekStart(newWeekStart);
                await fetchEvents(
                    format(newWeekStart, "yyyy-MM-dd"),
                    format(addDays(newWeekStart, 6), "yyyy-MM-dd")
                );
            } else {
                const newMonth = delta === 1
                    ? addMonths(currentMonth, 1)
                    : subMonths(currentMonth, 1);
                setCurrentMonth(newMonth);
                const gridStart = startOfWeek(startOfMonth(newMonth), { weekStartsOn: 0 });
                const gridEnd = endOfWeek(endOfMonth(newMonth), { weekStartsOn: 0 });
                await fetchEvents(
                    format(gridStart, "yyyy-MM-dd"),
                    format(gridEnd, "yyyy-MM-dd")
                );
            }
        },
        [view, currentWeekStart, currentMonth, fetchEvents]
    );

    // ─── View switch ────────────────────────────────────────────────────────
    const switchView = useCallback(
        async (newView: CalendarView) => {
            if (newView === view) return;
            setView(newView);
            if (newView === "month") {
                const month = startOfMonth(currentWeekStart);
                setCurrentMonth(month);
                const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
                const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
                await fetchEvents(
                    format(gridStart, "yyyy-MM-dd"),
                    format(gridEnd, "yyyy-MM-dd")
                );
            } else {
                const week = startOfWeek(currentMonth, { weekStartsOn: 0 });
                setCurrentWeekStart(week);
                await fetchEvents(
                    format(week, "yyyy-MM-dd"),
                    format(addDays(week, 6), "yyyy-MM-dd")
                );
            }
        },
        [view, currentWeekStart, currentMonth, fetchEvents]
    );

    // ─── Refresh after mutation ──────────────────────────────────────────────
    const refreshCurrentView = useCallback(async () => {
        if (view === "week") {
            await fetchEvents(
                format(currentWeekStart, "yyyy-MM-dd"),
                format(addDays(currentWeekStart, 6), "yyyy-MM-dd")
            );
        } else {
            const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
            const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
            await fetchEvents(
                format(gridStart, "yyyy-MM-dd"),
                format(gridEnd, "yyyy-MM-dd")
            );
        }
    }, [view, currentWeekStart, currentMonth, fetchEvents]);

    // ─── Week view helpers ───────────────────────────────────────────────────
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

    function getEventsForDay(date: Date): EventRow[] {
        return events.filter((e) => isSameDay(parseLocalDate(e.eventDate), date));
    }

    function getAllDayEventsForDay(date: Date): EventRow[] {
        return getEventsForDay(date).filter((e) => !e.eventTime);
    }

    const hasAnyAllDay = weekDays.some((d) => getAllDayEventsForDay(d).length > 0);
    const nowTopPx = nowMinutes * PX_PER_MINUTE;

    // ─── Toolbar label ───────────────────────────────────────────────────────
    const toolbarLabel = view === "week"
        ? formatWeekRange(currentWeekStart)
        : format(currentMonth, "MMMM yyyy");

    return (
        <div className="flex flex-col h-full">
            {/* ─── Toolbar ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 gap-3">
                {/* Left: nav arrows + label */}
                <div className="flex items-center gap-2 min-w-0">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(-1)}
                        disabled={isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(1)}
                        disabled={isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold ml-1 select-none truncate">
                        {toolbarLabel}
                    </span>
                    {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    )}
                </div>

                {/* Right: view toggle + series + create */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Week / Month toggle */}
                    <div className="flex border border-border rounded-md overflow-hidden text-xs font-medium">
                        <button
                            onClick={() => switchView("week")}
                            className={cn(
                                "px-3 py-1.5 transition-colors",
                                view === "week"
                                    ? "bg-foreground text-background"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => switchView("month")}
                            className={cn(
                                "px-3 py-1.5 transition-colors border-l border-border",
                                view === "month"
                                    ? "bg-foreground text-background"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Month
                        </button>
                    </div>

                    {canManageSeries && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSeriesSheetOpen(true)}
                        >
                            <ListOrdered className="h-4 w-4 mr-1" />
                            Series
                        </Button>
                    )}

                    {canCreate && (
                        <Button size="sm" onClick={() => router.push("/events/new")}>
                            <Plus className="h-4 w-4 mr-1" />
                            Create Event
                        </Button>
                    )}
                </div>
            </div>

            {/* ─── Month view ──────────────────────────────────────────────── */}
            {view === "month" && (
                <EventsMonthView
                    currentMonth={currentMonth}
                    events={events}
                    onEventClick={(e) => { setSelectedEvent(e); setSheetOpen(true); }}
                    isLoading={isLoading}
                />
            )}

            {/* ─── Week view ───────────────────────────────────────────────── */}
            {view === "week" && (
                <>
                    {/* Day headers */}
                    <div className="grid shrink-0" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                        <div className="border-b border-border" />
                        {weekDays.map((day, i) => {
                            const today = isToday(day);
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "border-b border-l border-border py-2 text-center",
                                        today && "bg-muted/20"
                                    )}
                                >
                                    <p className="text-xs text-muted-foreground font-medium">{DAYS[i]}</p>
                                    <div className={cn(
                                        "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                                        today ? "bg-red-500 text-white" : "text-foreground"
                                    )}>
                                        {format(day, "d")}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* All-day strip */}
                    {hasAnyAllDay && (
                        <div className="grid shrink-0 border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                            <div className="flex items-center justify-end pr-2 py-1">
                                <span className="text-[10px] text-muted-foreground">all-day</span>
                            </div>
                            {weekDays.map((day, i) => {
                                const allDay = getAllDayEventsForDay(day);
                                const today = isToday(day);
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "border-l border-border min-h-[28px] px-0.5 py-0.5 space-y-0.5",
                                            today && "bg-muted/20"
                                        )}
                                    >
                                        {allDay.map((e) => (
                                            <button
                                                key={e.id}
                                                onClick={() => { setSelectedEvent(e); setSheetOpen(true); }}
                                                className={cn(
                                                    "w-full text-left text-xs text-white rounded px-1 py-0.5 truncate transition-colors",
                                                    getEventBg(e)
                                                )}
                                            >
                                                <span className="font-semibold">{getBlockTypeLabel(e)}</span>
                                                {" · "}
                                                <span className="opacity-80">{getBlockSubtext(e)}</span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Scrollable 24h grid */}
                    <div
                        ref={gridRef}
                        className={cn(
                            "flex-1 overflow-y-auto relative",
                            isLoading && "opacity-50 pointer-events-none"
                        )}
                    >
                        <div
                            className="grid"
                            style={{
                                gridTemplateColumns: "56px repeat(7, 1fr)",
                                height: `${TOTAL_HEIGHT}px`,
                                minHeight: `${TOTAL_HEIGHT}px`,
                            }}
                        >
                            {/* Hour labels */}
                            <div className="relative">
                                {HOURS.map((h) => (
                                    <div
                                        key={h}
                                        className="absolute w-full flex items-start justify-end pr-2"
                                        style={{ top: `${h * 60 * PX_PER_MINUTE}px` }}
                                    >
                                        <span className="text-[10px] text-muted-foreground -mt-2">
                                            {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Day columns */}
                            {weekDays.map((day, colIdx) => {
                                const today = isToday(day);
                                const laned = layoutDayEvents(getEventsForDay(day).filter((e) => !!e.eventTime));

                                return (
                                    <div
                                        key={colIdx}
                                        className={cn(
                                            "relative border-l border-border",
                                            today && "bg-muted/20"
                                        )}
                                        style={{ height: `${TOTAL_HEIGHT}px` }}
                                    >
                                        {/* Hour grid lines */}
                                        {HOURS.map((h) => (
                                            <div
                                                key={h}
                                                className="absolute w-full border-t border-border/40"
                                                style={{ top: `${h * 60 * PX_PER_MINUTE}px` }}
                                            />
                                        ))}

                                        {/* Current-time line */}
                                        {today && (
                                            <div
                                                className="absolute w-full z-10 pointer-events-none"
                                                style={{ top: `${nowTopPx}px` }}
                                            >
                                                <div className="relative">
                                                    <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
                                                    <div className="border-t-2 border-red-500 w-full" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Event blocks */}
                                        {laned.map(({ event: e, lane, totalLanes, topPx, heightPx }) => {
                                            const widthPct = 100 / totalLanes;
                                            const leftPct = (lane / totalLanes) * 100;
                                            const typeLabel = getBlockTypeLabel(e);
                                            const subtext = getBlockSubtext(e);

                                            return (
                                                <button
                                                    key={e.id}
                                                    onClick={() => { setSelectedEvent(e); setSheetOpen(true); }}
                                                    className={cn(
                                                        "absolute text-white text-left rounded px-1 py-2 overflow-hidden transition-opacity flex flex-col",
                                                        getEventBg(e)
                                                    )}
                                                    style={{
                                                        top: `${topPx}px`,
                                                        height: `${heightPx}px`,
                                                        left: `${leftPct}%`,
                                                        width: `calc(${widthPct}% - 2px)`,
                                                        zIndex: 5,
                                                    }}
                                                >
                                                    <p className="text-[10px] font-semibold leading-none truncate">{typeLabel}</p>
                                                    {heightPx > 30 && (
                                                        <p className="text-[10px] leading-tight truncate mt-0.5 opacity-80">{subtext}</p>
                                                    )}
                                                    {heightPx > 48 && e.eventTime && (
                                                        <p className="text-[10px] opacity-70 leading-none mt-0.5">{e.eventTime}</p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* ─── Detail sheet ────────────────────────────────────────────── */}
            <EventDetailSheet
                event={selectedEvent}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onCompleted={refreshCurrentView}
            />

            {/* ─── Series sheet ─────────────────────────────────────────────── */}
            <ManageSeriesSheet
                open={seriesSheetOpen}
                onOpenChange={setSeriesSheetOpen}
                onChanged={refreshCurrentView}
            />
        </div>
    );
}
