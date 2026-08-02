"use server";

import { z } from "zod";
import { medalFormSchema, medalCriteriaFormSchema } from "./schema";
import { createMedal, updateMedal, deleteMedal } from "@/services/medals";
import {
    addMedalCriteria,
    deleteMedalCriteria,
    getCriteriaForMedal,
} from "@/services/medal-criteria";

export async function createMedalAction(input: z.infer<typeof medalFormSchema>) {
    try {
        const data = medalFormSchema.parse(input);
        const row = await createMedal({
            name: data.name,
            description: data.description ?? null,
            imageUrl: data.imageUrl,
            autoAwardEnabled: data.autoAwardEnabled,
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
            autoAwardEnabled: data.autoAwardEnabled,
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

export async function getCriteriaForMedalAction(medalId: string) {
    return getCriteriaForMedal(medalId);
}

export async function addMedalCriteriaAction(
    medalId: string,
    input: z.infer<typeof medalCriteriaFormSchema>,
) {
    try {
        const data = medalCriteriaFormSchema.parse(input);
        const row = await addMedalCriteria(medalId, {
            criteriaType: data.criteriaType,
            qualificationId: data.qualificationId ?? null,
            requiredMedalId: data.requiredMedalId ?? null,
            threshold: data.threshold ?? null,
            zeusRole: data.zeusRole ?? null,
            eventType: data.eventType ?? null,
            ruleGroup: data.ruleGroup,
        });
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to add criteria" };
    }
}

export async function deleteMedalCriteriaAction(id: string) {
    try {
        await deleteMedalCriteria(id);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete criteria" };
    }
}
