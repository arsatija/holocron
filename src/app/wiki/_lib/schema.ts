import { z } from "zod";

export const collectionFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().max(2000).optional(),
    icon: z.string().max(64).optional().nullable(),
    readPermissions: z.array(z.string()).default([]),
    editPermissions: z.array(z.string()).default([]),
});

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;
