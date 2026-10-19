import { z } from "zod";

export const medalFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    imageUrl: z.string().min(1, "Image is required"),
    autoAwardEnabled: z.boolean(),
});

export type MedalFormValues = z.infer<typeof medalFormSchema>;

export const medalCriteriaTypes = [
    "Qualification",
    "ZeusCount",
    "ReferralCount",
    "TrainingCompletionCount",
    "AttendanceCount",
    "TenureDays",
    "HasMedal",
] as const;

export const zeusRoles = ["Zeus", "CoZeus", "Either"] as const;

export const criteriaEventTypes = [
    "Main",
    "Skirmish",
    "Fun",
    "Raid",
    "Joint",
    "Training",
] as const;

export const medalCriteriaFormSchema = z.object({
    criteriaType: z.enum(medalCriteriaTypes),
    qualificationId: z.string().optional().nullable(),
    requiredMedalId: z.string().optional().nullable(),
    threshold: z.coerce.number().int().min(1).optional().nullable(),
    zeusRole: z.enum(zeusRoles).optional().nullable(),
    eventType: z.enum(criteriaEventTypes).optional().nullable(),
    ruleGroup: z.coerce.number().int().min(1),
});

export type MedalCriteriaFormValues = z.infer<typeof medalCriteriaFormSchema>;