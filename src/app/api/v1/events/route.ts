import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { events, campaigns, operations, trainingEvents, qualifications, troopers, eventSeries } from "@/db/schema";
import { eq, gte, lte, and, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const from = searchParams.get("from");
        const to = searchParams.get("to") ?? undefined;
        const kind = searchParams.get("kind");

        const fromDate =
            from === "today"
                ? new Date().toISOString().split("T")[0]
                : (from ?? undefined);

        // Alias the troopers table twice — once for zeus (transmitted_by), once for trainer
        const transmittedByTrooper = alias(troopers, "transmitted_by_trooper");
        const scheduledTrainer = alias(troopers, "scheduled_trainer");

        const rows = await db
            .select({
                // Base event fields
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
                // Operations fields
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
                // Training event fields
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
                fromDate && to
                    ? and(gte(events.eventDate, fromDate), lte(events.eventDate, to))
                    : fromDate
                    ? gte(events.eventDate, fromDate)
                    : to
                    ? lte(events.eventDate, to)
                    : undefined
            )
            .orderBy(asc(events.eventDate));

        const filtered = kind
            ? rows.filter((r) => r.eventKind === kind)
            : rows;

        return NextResponse.json(filtered);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}
