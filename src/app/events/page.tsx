export const dynamic = "force-dynamic";

import { db } from "@/db";
import { events, campaigns, operations, trainingEvents, qualifications, troopers, eventSeries } from "@/db/schema";
import { asc, eq, gte, lte, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import EventsCalendar from "./_components/events-calendar";
import { EventRow } from "./_components/event-card";
import { ensureSeriesExtended } from "@/services/event-series";


async function getWeekEvents(weekStartStr: string, weekEndStr: string): Promise<EventRow[]> {
    const transmittedByTrooper = alias(troopers, "transmitted_by_trooper");
    const scheduledTrainer = alias(troopers, "scheduled_trainer");

    const rows = await db
        .select({
            id: events.id,
            name: events.name,
            description: events.description,
            bannerImage: events.bannerImage,
            eventDate: events.eventDate,
            eventTime: events.eventTime,
            eventEndTime: events.eventEndTime,
            eventKind: events.eventKind,
            campaignId: events.campaignId,
            campaignName: campaigns.name,
            seriesId: events.seriesId,
            seriesName: eventSeries.name,
            seriesOperationType: eventSeries.operationType,
            // Operation fields
            operationId: operations.id,
            operationType: operations.operationType,
            operationName: operations.operationName,
            transmittedById: operations.transmittedById,
            deployedForces: operations.deployedForces,
            objectives: operations.objectives,
            situationReport: operations.situationReport,
            eventNotes: operations.eventNotes,
            attendanceId: operations.attendanceId,
            transmittedByName: transmittedByTrooper.name,
            transmittedByNumbers: transmittedByTrooper.numbers,
            transmittedByRank: transmittedByTrooper.rank,
            // Training fields
            trainingEventId: trainingEvents.id,
            qualificationId: trainingEvents.qualificationId,
            scheduledTrainerId: trainingEvents.scheduledTrainerId,
            trainingCompletionId: trainingEvents.trainingCompletionId,
            qualificationName: qualifications.name,
            qualificationAbbreviation: qualifications.abbreviation,
            trainerName: scheduledTrainer.name,
            trainerNumbers: scheduledTrainer.numbers,
            trainerRank: scheduledTrainer.rank,
        })
        .from(events)
        .leftJoin(campaigns, eq(events.campaignId, campaigns.id))
        .leftJoin(eventSeries, eq(events.seriesId, eventSeries.id))
        .leftJoin(operations, eq(operations.eventId, events.id))
        .leftJoin(trainingEvents, eq(trainingEvents.eventId, events.id))
        .leftJoin(
            transmittedByTrooper,
            eq(operations.transmittedById, transmittedByTrooper.id)
        )
        .leftJoin(
            scheduledTrainer,
            eq(trainingEvents.scheduledTrainerId, scheduledTrainer.id)
        )
        .leftJoin(
            qualifications,
            eq(trainingEvents.qualificationId, qualifications.id)
        )
        .where(
            and(
                gte(events.eventDate, weekStartStr),
                lte(events.eventDate, weekEndStr)
            )
        )
        .orderBy(asc(events.eventDate));

    return rows as EventRow[];
}

export default async function EventsPage() {
    const today = new Date();
    // Default view is month — fetch the full visible grid (Sun before month start → Sat after month end)
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const weekStartStr = format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd");
    const weekStartStrForGrid = format(gridStart, "yyyy-MM-dd");
    const weekEndStr = format(gridEnd, "yyyy-MM-dd");

    // Ensure each active series has at least 8 future events before fetching
    await ensureSeriesExtended();

    const initialEvents = await getWeekEvents(weekStartStrForGrid, weekEndStr);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Hero banner */}
            <div className="relative w-full bg-background border-b border-border overflow-hidden shrink-0">
                <div
                    className="absolute inset-0 opacity-[0.12] dark:opacity-[0.35]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                        maskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                    }}
                />
                <div className="relative container mx-auto px-4 py-10 md:py-14 text-center">
                    <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                        9th Assault Corps
                    </p>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#993534]">
                        Events
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Upcoming operations, training sessions, and unit activities.
                    </p>
                </div>
            </div>

            {/* Calendar — full width, fills remaining height */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <EventsCalendar
                    initialWeekStart={weekStartStr}
                    initialEvents={initialEvents}
                />
            </div>
        </div>
    );
}
