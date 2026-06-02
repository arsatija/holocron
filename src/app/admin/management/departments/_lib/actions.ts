"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { departmentFormSchema } from "./schema";
import { createDepartment, updateDepartment, deleteDepartment } from "@/services/departments";

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

export async function createDepartmentAction(input: z.infer<typeof departmentFormSchema>) {
    try {
        const data = departmentFormSchema.parse(input);
        const actorId = await getActorId();
        const row = await createDepartment({
            name: data.name,
            description: data.description ?? null,
            icon: data.icon,
            parentId: data.parentId ?? null,
            priority: data.priority,
            departmentScopes: data.departmentScopes,
        }, actorId);
        return { id: row.id };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to create department" };
    }
}

export async function updateDepartmentAction(id: string, input: z.infer<typeof departmentFormSchema>) {
    try {
        const data = departmentFormSchema.parse(input);
        const actorId = await getActorId();
        await updateDepartment(id, {
            name: data.name,
            description: data.description ?? null,
            icon: data.icon,
            parentId: data.parentId ?? null,
            priority: data.priority,
            departmentScopes: data.departmentScopes,
        }, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to update department" };
    }
}

export async function deleteDepartmentAction(id: string) {
    try {
        const actorId = await getActorId();
        await deleteDepartment(id, actorId);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Failed to delete department" };
    }
}
