"use server";

import {
    createAttendance,
    NewAttendanceWithTroopers,
} from "@/services/attendances";
import { z } from "zod";
import { formSchema } from "./schema";

export async function createAttendanceAction(
    values: z.infer<typeof formSchema>
) {
    const rawFormData = await formSchema.parseAsync(values);

    const attendanceSubmissionValues: NewAttendanceWithTroopers = {
        zeusId: rawFormData.zeusId,
        coZeusIds: rawFormData.coZeusIds,
        eventDate: rawFormData.eventDate.toISOString(),
        eventName: rawFormData.eventName,
        trooperIds: rawFormData.trooperIds,
    };

    const { id, error } = await createAttendance(attendanceSubmissionValues);

    if (error) {
        return { error };
    }

    return { id };
}
