"use server";

import { cookies } from "next/headers";
import {
    createMedicAttendance,
    deleteMedicAttendance,
    getMedicOptions,
    getMedicElementOptions,
    getOperationEventOptions,
} from "@/services/medic-attendances";
import { medicAttendanceFormSchema, MedicAttendanceFormValues } from "./schema";

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

export async function getMedicOptionsAction() {
    return getMedicOptions();
}

export async function getMedicElementOptionsAction() {
    return getMedicElementOptions();
}

export async function getOperationEventOptionsAction() {
    return getOperationEventOptions();
}

export async function createMedicAttendanceAction(input: MedicAttendanceFormValues) {
    try {
        const data = medicAttendanceFormSchema.parse(input);
        const actorId = await getActorId();
        const result = await createMedicAttendance(data, actorId);
        if (!result.success) {
            return { error: result.error ?? "Failed to log medic attendance" };
        }
        return { id: result.id };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to log medic attendance",
        };
    }
}

export async function deleteMedicAttendanceAction(id: string) {
    try {
        const actorId = await getActorId();
        const result = await deleteMedicAttendance(id, actorId);
        if (!result.success) {
            return { error: result.error ?? "Failed to delete record" };
        }
        return { success: true };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Failed to delete record",
        };
    }
}