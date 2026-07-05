import { z } from "zod";

export const QUALIFICATION_CATEGORIES = [
    "Standard",
    "Medical",
    "Advanced",
    "Aviation",
    "Detachments",
    "Leadership",
    "Zeus",
] as const;

export const qualificationFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    abbreviation: z.string().min(1, "Abbreviation is required").max(4, "Max 4 characters"),
    category: z.enum(QUALIFICATION_CATEGORIES),
    rankRequirement: z.string().min(1, "Rank requirement is required").max(50),
    description: z.string().optional(),
});

export type QualificationFormValues = z.infer<typeof qualificationFormSchema>;
