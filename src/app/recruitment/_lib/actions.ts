"use server";

import { NewTrooper } from "@/db/schema";
import { createTrooper, getAllTrooperDesignations } from "@/services/troopers";
import { z } from "zod";
import { cookies } from "next/headers";

import { formSchema } from "./validation";

async function getActorId(): Promise<string | undefined> {
    try {
        const cookieStore = await cookies();
        const raw = cookieStore.get("trooperCtx")?.value;
        if (!raw) return undefined;
        return JSON.parse(raw)?.id ?? undefined;
    } catch {
        return undefined;
    }
}

export async function create(formData: z.infer<typeof formSchema>) {
    try {
        const rawFormData = await formSchema.parseAsync(formData);
        const actorId = await getActorId();

        // example name: 0000 "Disney"
        const [numbers, name] = rawFormData.recruit_name.split(" ");
        const recruitName = name.replace(/"/g, "");

        const recruit: NewTrooper = {
            numbers: parseInt(numbers),
            name: recruitName,
            referredBy: rawFormData.referred_by,
            recruitedBy: rawFormData.recruiter_name,
        };

        const trooper = await createTrooper(recruit, actorId);
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
