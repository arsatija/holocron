"use server";

import { z } from "zod";
import { createTrainingCompletion, updateTrainingCompletion } from "@/services/training-completions";
import { revalidateTag } from "next/cache";
import { NewTrainingCompletion } from "@/db/schema";

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
});

export async function createTrainingAction(
    formData: z.infer<typeof formSchema>
) {
    try {
        const rawFormData = await formSchema.parseAsync(formData);

        const trainingSubmissionData = {
            trainerId: rawFormData.trainerId,
            qualificationId: rawFormData.qualificationId,
            traineeIds: rawFormData.traineeIds,
            trainingDate: rawFormData.trainingDate.toISOString(),
            trainingNotes: rawFormData.trainingNotes,
        };

        const trainingId = await createTrainingCompletion(trainingSubmissionData);

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
            trainingSubmissionData as NewTrainingCompletion
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
