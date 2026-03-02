"use server";

import { db } from "@/db";
import {
    trainingEvents,
    trainingCompletions,
    NewTrainingEvent,
    NewTrainingCompletion,
    trooperQualifications,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createTrainingCompletion } from "@/services/training-completions";

export async function getTrainingEvent(eventId: string) {
    return db.query.trainingEvents.findFirst({
        where: eq(trainingEvents.eventId, eventId),
    });
}

export async function createTrainingEventRecord(data: NewTrainingEvent) {
    const result = await db.insert(trainingEvents).values(data).returning();
    revalidateTag("events");
    return result[0];
}

export async function updateTrainingEventRecord(
    trainingEventId: string,
    data: Partial<NewTrainingEvent>
) {
    await db
        .update(trainingEvents)
        .set(data)
        .where(eq(trainingEvents.id, trainingEventId));
    revalidateTag("events");
}

/**
 * Completes a scheduled training event by:
 * 1. Creating a training_completion record (awards qualifications to trainees)
 * 2. Linking the completion ID back into trainings.training_completion_id
 */
export async function completeTrainingEvent(
    trainingEventId: string,
    traineeIds: string[]
): Promise<{ success: true; completionId: string } | { error: string }> {
    try {
        const trainingEvent = await db.query.trainingEvents.findFirst({
            where: eq(trainingEvents.id, trainingEventId),
            with: {
                event: {
                    columns: { eventDate: true, name: true },
                },
            },
        });

        if (!trainingEvent) {
            return { error: "Training event not found" };
        }

        if (trainingEvent.trainingCompletionId) {
            return { error: "Training already completed" };
        }

        if (!trainingEvent.qualificationId) {
            return { error: "Training event has no qualification set" };
        }

        if (!trainingEvent.scheduledTrainerId) {
            return { error: "Training event has no trainer set" };
        }

        const completionData: NewTrainingCompletion = {
            trainerId: trainingEvent.scheduledTrainerId,
            traineeIds: traineeIds,
            qualificationId: trainingEvent.qualificationId,
            trainingDate:
                trainingEvent.event?.eventDate ??
                new Date().toISOString().split("T")[0],
            trainingNotes: `Completed via event: ${trainingEvent.event?.name ?? ""}`,
        };

        const completionId = await createTrainingCompletion(completionData);

        await db
            .update(trainingEvents)
            .set({ trainingCompletionId: completionId })
            .where(eq(trainingEvents.id, trainingEventId));

        revalidateTag("events");

        return { success: true, completionId };
    } catch (error) {
        console.error("Error completing training event:", error);
        return { error: "Failed to complete training event" };
    }
}
