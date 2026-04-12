"use server";

import { z } from "zod";
import { createTrainingCompletion, updateTrainingCompletion } from "@/services/training-completions";
import { linkCompletionToEvent } from "@/services/trainings";
import { revalidateTag } from "next/cache";
import { NewTrainingCompletion } from "@/db/schema";
import { cookies } from "next/headers";

async function getActorId(): Promise<string | undefined> {
    try {
        const cookieStore = await cookies();
        const raw = cookieStore.get("trooperCtx")?.value;
        if (!raw) return undefined;
        return JSON.parse(raw)?.id ?? undefined;
    } catch {
        return undefined;
    }
}

const formSchema = z.object({
    id: z.string().optional(),
    trainerId: z.string().min(1),
    qualificationId: z.string().min(1),
    traineeIds: z.array(z.string()).optional().default([]),
    trainingDate: z
        .date({
            required_error: "Training date is required.",
        })
        .default(new Date()),
    trainingNotes: z.string().optional(),
    linkedTrainingEventId: z.string().optional(),
});

export async function createTrainingAction(
    formData: z.infer<typeof formSchema>
) {
    try {
        const rawFormData = await formSchema.parseAsync(formData);
        const actorId = await getActorId();

        const trainingSubmissionData = {
            trainerId: rawFormData.trainerId,
            qualificationId: rawFormData.qualificationId,
            traineeIds: rawFormData.traineeIds,
            trainingDate: rawFormData.trainingDate.toISOString(),
            trainingNotes: rawFormData.trainingNotes,
        };

        const trainingId = await createTrainingCompletion(trainingSubmissionData, actorId);

        if (rawFormData.linkedTrainingEventId) {
            await linkCompletionToEvent(rawFormData.linkedTrainingEventId, trainingId);
        }

        return {
            success: true,
            id: trainingId,
        };
    } catch (error) {
        console.error(error);
        return {
            error: "Training creation failed",
        };
    }
}

export async function refresh() {
    revalidateTag("trainings");
}

export async function updateTrainingAction(
    formData: z.infer<typeof formSchema>
) {
    try {
        const rawFormData = await formSchema.parseAsync(formData);
        const actorId = await getActorId();

        const trainingId = rawFormData.id;
        if (!trainingId) {
            throw new Error("Training ID is required");
        }
        const trainingSubmissionData = {
            id: trainingId,
            trainerId: rawFormData.trainerId,
            qualificationId: rawFormData.qualificationId,
            traineeIds: rawFormData.traineeIds,
            trainingDate: rawFormData.trainingDate.toISOString(),
            trainingNotes: rawFormData.trainingNotes,
        };

        const { success, error } = await updateTrainingCompletion(
            trainingId,
            trainingSubmissionData as NewTrainingCompletion,
            actorId,
        );

        if (error) {
            throw error;
        }

        return {
            success: true,
            id: trainingId,
        };
    } catch (error) {
        console.error(
            `Training update for ${formData.id} failed with error: ${error}`
        );
        return {
            error: "Training update failed",
        };
    }
}
