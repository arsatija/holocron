import { z } from "zod";

export const rankFormSchema = z.object({
    id: z.number().optional(),
    grade: z.string().max(10).optional().nullable(),
    name: z.string().min(1, "Name is required").max(100),
    abbreviation: z.string().max(10).optional().nullable(),
    rankLevel: z.enum(["Enlisted", "JNCO", "SNCO", "Company", "Command"]),
    order: z.coerce.number().int().optional().nullable(),
    nextRankId: z.coerce.number().int().optional().nullable(),
});

export type RankFormValues = z.infer<typeof rankFormSchema>;
