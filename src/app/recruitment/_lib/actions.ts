"use server";

import { NewTrooper } from "@/db/schema";
import { createTrooper, getAllTrooperDesignations } from "@/services/troopers";
import { z } from "zod";

import { formSchema } from "./validation";

export async function create(formData: z.infer<typeof formSchema>) {
    try {
        const rawFormData = await formSchema.parseAsync(formData);

        // example name: 0000 "Disney"
        const [numbers, name] = rawFormData.recruit_name.split(" ");
        const recruitName = name.replace(/"/g, "");

        const recruit: NewTrooper = {
            numbers: parseInt(numbers),
            name: recruitName,
            referredBy: rawFormData.referred_by,
            recruitedBy: rawFormData.recruiter_name,
        };

        const trooper = await createTrooper(recruit);
        if (!trooper) {
            throw new Error("Failed to create trooper");
        }

        return {
            success: true,
            id: trooper.id,
        };
    } catch (error) {
        console.error(error);
        return {
            error: "Failed to create trooper",
        };
    }
}
