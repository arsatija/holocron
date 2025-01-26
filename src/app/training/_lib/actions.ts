"use server";

import { z } from "zod";
import { createTraining } from "@/services/trainings";
import { revalidateTag } from "next/cache";

const formSchema = z.object({
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

        const trainingId = await createTraining(trainingSubmissionData);

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
