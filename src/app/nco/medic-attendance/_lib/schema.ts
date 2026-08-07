import { z } from "zod";

export const medicAttendanceFormSchema = z.object({
    medicId: z.string().min(1, "Medic is required"),
    elementId: z.string().min(1, "Element is required"),
    operationType: z.enum(["Main", "Skirmish", "Fun", "Raid", "Joint", "Training"]),
    eventId: z.string().min(1, "Linked operation is required"),
});

export type MedicAttendanceFormValues = z.infer<typeof medicAttendanceFormSchema>;