import { z } from "zod";

export const billetFormSchema = z.object({
    id: z.string().uuid().optional(),
    role: z.string().min(1, "Role is required").max(100),
    slug: z.string().max(100).optional().nullable(),
    unitElementId: z.string().uuid({ message: "Unit element is required" }),
    superiorBilletId: z.string().uuid().optional().nullable(),
    priority: z.coerce.number().int().default(-1),
});

export type BilletFormValues = z.infer<typeof billetFormSchema>;
