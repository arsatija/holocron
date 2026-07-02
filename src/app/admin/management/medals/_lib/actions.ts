"use server";

import { z } from "zod";
import { medalFormSchema } from "./schema";
import { createMedal, updateMedal, deleteMedal } from "@/services/medals";

export async function createMedalAction(input: z.infer<typeof medalFormSchema>) {
    try {
        const data = medalFormSchema.parse(input);
        const row = await createMedal({
            name: data.name,
            description: data.description ?? null,
            imageUrl: data.imageUrl,
        });
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create medal" };
    }
}

export async function updateMedalAction(id: string, input: z.infer<typeof medalFormSchema>) {
    try {
        const data = medalFormSchema.parse(input);
        await updateMedal(id, {
            name: data.name,
            description: data.description ?? null,
            imageUrl: data.imageUrl,
        });
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to update medal" };
    }
}

export async function deleteMedalAction(id: string) {
    try {
        await deleteMedal(id);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete medal" };
    }
}
