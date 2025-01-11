"use server";

import { NewTrooper } from "@/db/schema";
import { createTrooper, getAllTrooperDesignations } from "@/services/troopers";
import { z } from "zod";

const formSchema = z.object({
    age: z.boolean(),
    microphone: z.boolean(),
    referral: z.string({
        required_error:
            "Please select how the recruit found out about the unit.",
    }),
    referred_by: z.string().optional(),
    recruit_name: z
        .string()
        .regex(
            /^\d{4}\s"[^"]*"$/,
            'It is IMPERATIVE that you use the following format: 0000 "Name" [Ex. 0000 "Disney"]'
        )
        .refine(
            async (data) => {
                const [numbers, name] = data.split(" ");
                const recruitName = name.replace(/"/g, "").toLowerCase();
                const res = await getAllTrooperDesignations();
                return (
                    !res.numbers.includes(parseInt(numbers)) &&
                    !res.names.includes(recruitName) &&
                    parseInt(numbers) >= 1000
                );
            },
            { message: "This name or number is already taken." }
        ),
    recruiter_name: z.string(),
});

export async function create(formData: z.infer<typeof formSchema>) {
    const rawFormData = await formSchema.parseAsync(formData);

    // example name: 0000 "Disney"
    const [numbers, name] = rawFormData.recruit_name.split(" ");
    const recruitName = name.replace(/"/g, "");

    const recruit: NewTrooper = {
        numbers: parseInt(numbers),
        name: recruitName,
    };

    const response = await createTrooper(recruit);
}
