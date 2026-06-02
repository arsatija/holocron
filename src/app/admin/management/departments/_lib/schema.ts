import { z } from "zod";

const SCOPES = ["Admin", "Recruitment", "Training", "Attendance", "Roster", "Qualifications", "Mod", "SGD"] as const;

export const departmentFormSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().optional().nullable(),
    icon: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    priority: z.coerce.number().int().default(-1),
    departmentScopes: z.array(z.enum(SCOPES)).default([]),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
