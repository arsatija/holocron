"use server";

import { z } from "zod";
import { qualificationFormSchema } from "./schema";
import { createQualification, updateQualification, deleteQualification } from "@/services/qualifications";

export async function createQualificationAction(input: z.infer<typeof qualificationFormSchema>) {
    try {
        const data = qualificationFormSchema.parse(input);
        const row = await createQualification({
            ...data,
            description: data.description ?? null,
        });
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create qualification" };
    }
}

export async function updateQualificationAction(id: string, input: z.infer<typeof qualificationFormSchema>) {
    try {
        const data = qualificationFormSchema.parse(input);
        await updateQualification(id, {
            ...data,
            description: data.description ?? null,
        });
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to update qualification" };
    }
}

export async function deleteQualificationAction(id: string) {
    try {
        await deleteQualification(id);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete qualification" };
    }
}
