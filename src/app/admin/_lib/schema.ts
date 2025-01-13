import { z } from "zod";

export const formSchema = z.object({
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
    eventName: z.string().min(1).default("Skirmish"),
    trooperIds: z.array(
        z.string().uuid({
            message: "Invalid Trooper ID",
        })
    ),
});
