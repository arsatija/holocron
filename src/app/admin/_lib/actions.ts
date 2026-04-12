"use server";

import {
    createAttendance,
    NewAttendanceWithTroopers,
} from "@/services/attendances";
import { z } from "zod";
import { formSchema } from "./schema";
import { revalidateTag } from "next/cache";
import { updateOperation } from "@/services/operations";
import { db } from "@/db";
import { operations, events } from "@/db/schema";
import { NewAttendance } from "@/db/schema";
import { OperationEntry } from "@/lib/types";
import { eq } from "drizzle-orm";
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

export async function createOperationAction(
    values: z.infer<typeof formSchema>
) {
    const rawFormData = await formSchema.parseAsync(values);

    const attendanceSubmissionValues: NewAttendanceWithTroopers = {
        zeusId: rawFormData.zeusId,
        coZeusIds: rawFormData.coZeusIds,
        eventDate: rawFormData.eventDate.toISOString(),
        eventNotes: rawFormData.eventNotes,
        eventType: rawFormData.eventType,
        trooperIds: rawFormData.trooperIds,
    };

    const actorId = await getActorId();
    const { id, error } = await createAttendance(attendanceSubmissionValues, actorId);

    if (error) {
        return { error };
    }

    // If linked to an event, point that event's operation at this attendance record
    if (rawFormData.eventId && id) {
        await db
            .update(operations)
            .set({ attendanceId: id })
            .where(eq(operations.eventId, rawFormData.eventId));
        revalidateTag("events");
    }

    return { success: true, id };
}

export async function refresh() {
    revalidateTag("troopers");
    revalidateTag("operations");
}

export async function updateOperationAction(
    values: z.infer<typeof formSchema>
) {
    try {
        const rawFormData = await formSchema.parseAsync(values);

        const operationId = rawFormData.id;
        if (!operationId) {
            throw new Error("Operation ID is required");
        }

        const operationData: NewAttendance = {
            id: operationId,
            zeusId: rawFormData.zeusId,
            coZeusIds: rawFormData.coZeusIds,
            eventDate: rawFormData.eventDate.toISOString(),
            eventType: rawFormData.eventType,
            eventNotes: rawFormData.eventNotes,
        };

        const actorId = await getActorId();
        const { success, error } = await updateOperation(
            operationData,
            rawFormData.trooperIds,
            actorId
        );

        if (error) {
            return { error };
        }

        return { success, id: operationId };
    } catch (error) {
        console.error(
            `Operation update for ${values.id} failed with error: ${error}`
        );
        return {
            error: "Operation update failed",
        };
    }
}
