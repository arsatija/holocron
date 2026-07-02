import { z } from "zod";

export const medalFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    imageUrl: z.string().min(1, "Image is required"),
});

export type MedalFormValues = z.infer<typeof medalFormSchema>;
