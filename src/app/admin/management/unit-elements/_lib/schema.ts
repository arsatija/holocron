import { z } from "zod";

export const unitElementFormSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required").max(255),
    icon: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    priority: z.coerce.number().int().default(-1),
    radio: z.string().max(255).optional().nullable(),
});

export type UnitElementFormValues = z.infer<typeof unitElementFormSchema>;
