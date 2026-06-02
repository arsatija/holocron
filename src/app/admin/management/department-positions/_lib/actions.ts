"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { departmentPositionFormSchema } from "./schema";
import {
    createDepartmentPosition,
    updateDepartmentPosition,
    deleteDepartmentPosition,
    bulkUpdateDepartmentPositionOrder,
} from "@/services/departments";

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

export async function createDepartmentPositionAction(input: z.infer<typeof departmentPositionFormSchema>) {
    try {
        const data = departmentPositionFormSchema.parse(input);
        const actorId = await getActorId();
        const row = await createDepartmentPosition({
            role: data.role,
            slug: data.slug ?? null,
            departmentId: data.departmentId,
            superiorPositionId: data.superiorPositionId ?? null,
            priority: data.priority,
        }, actorId);
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create position" };
    }
}

export async function updateDepartmentPositionAction(id: string, input: z.infer<typeof departmentPositionFormSchema>) {
    try {
        const data = departmentPositionFormSchema.parse(input);
        const actorId = await getActorId();
        await updateDepartmentPosition(id, {
            role: data.role,
            slug: data.slug ?? null,
            departmentId: data.departmentId,
            superiorPositionId: data.superiorPositionId ?? null,
            priority: data.priority,
        }, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to update position" };
    }
}

export async function deleteDepartmentPositionAction(id: string) {
    try {
        const actorId = await getActorId();
        await deleteDepartmentPosition(id, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete position" };
    }
}

export async function bulkUpdatePositionOrderAction(
    updates: { id: string; departmentId: string; priority: number }[]
) {
    try {
        const actorId = await getActorId();
        await bulkUpdateDepartmentPositionOrder(updates, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to save order" };
    }
}
