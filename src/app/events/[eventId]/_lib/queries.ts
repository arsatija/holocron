import { db } from "@/db";
import {
    events,
    campaigns,
    operations,
    trainingEvents,
    qualifications,
    troopers,
    eventSeries,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function getEvent(eventId: string) {
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
            transmittedByName: transmittedByTrooper.name,
            transmittedByNumbers: transmittedByTrooper.numbers,
            transmittedByRank: transmittedByTrooper.rank,
            deployedForces: operations.deployedForces,
            objectives: operations.objectives,
            situationReport: operations.situationReport,
            eventNotes: operations.eventNotes,
            attendanceId: operations.attendanceId,
            // Training fields
            trainingEventId: trainingEvents.id,
            qualificationId: trainingEvents.qualificationId,
            qualificationName: qualifications.name,
            qualificationAbbreviation: qualifications.abbreviation,
            scheduledTrainerId: trainingEvents.scheduledTrainerId,
            trainerName: scheduledTrainer.name,
            trainerNumbers: scheduledTrainer.numbers,
            trainingCompletionId: trainingEvents.trainingCompletionId,
        })
        .from(events)
        .leftJoin(campaigns, eq(events.campaignId, campaigns.id))
        .leftJoin(eventSeries, eq(events.seriesId, eventSeries.id))
        .leftJoin(operations, eq(operations.eventId, events.id))
        .leftJoin(trainingEvents, eq(trainingEvents.eventId, events.id))
        .leftJoin(transmittedByTrooper, eq(operations.transmittedById, transmittedByTrooper.id))
        .leftJoin(scheduledTrainer, eq(trainingEvents.scheduledTrainerId, scheduledTrainer.id))
        .leftJoin(qualifications, eq(trainingEvents.qualificationId, qualifications.id))
        .where(eq(events.id, eventId))
        .limit(1);

    return rows[0] ?? null;
}

export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEvent>>>;
