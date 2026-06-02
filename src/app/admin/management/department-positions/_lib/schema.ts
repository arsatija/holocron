import { z } from "zod";

export const departmentPositionFormSchema = z.object({
    id: z.string().uuid().optional(),
    role: z.string().min(1, "Role is required").max(255),
    slug: z.string().max(100).optional().nullable(),
    departmentId: z.string().uuid({ message: "Department is required" }),
    superiorPositionId: z.string().uuid().optional().nullable(),
    priority: z.coerce.number().int().default(-1),
});

export type DepartmentPositionFormValues = z.infer<typeof departmentPositionFormSchema>;
