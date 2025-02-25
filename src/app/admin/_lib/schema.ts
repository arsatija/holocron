import { selectEventTypesSchema } from "@/db/schema";
import { z } from "zod";

export const formSchema = z.object({
    id: z.string().optional(),
    zeusId: z.string().uuid({
        message: "Invalid Zeus ID",
    }),
    coZeusIds: z
        .array(
            z.string().uuid({
                message: "Invalid Co-Zeus ID",
            })
        )
        .optional(),
    eventDate: z
        .date({
            required_error: "Operation date is required",
        })
        .default(new Date()),
    eventType: z.enum(selectEventTypesSchema.options),
    trooperIds: z.array(
        z.string().uuid({
            message: "Invalid Trooper ID",
        })
    ),
    eventNotes: z.string().optional(),
});
