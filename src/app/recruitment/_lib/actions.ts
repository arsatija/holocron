"use server";

import { z } from "zod";
const recruitmentFormSchema = z.object({
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
        ),
    recruiter_name: z.string(),
});

export async function create(formData: z.infer<typeof recruitmentFormSchema>) {

    const rawFormData = recruitmentFormSchema.parse(formData);
      // Test it out:
      console.log(rawFormData);
}
