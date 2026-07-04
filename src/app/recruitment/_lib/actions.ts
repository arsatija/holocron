"use server";

import { NewRecruitmentLog, NewTrooper } from "@/db/schema";
import { createTrooper, getAllTrooperDesignations } from "@/services/troopers";
import { createRecruitmentLog } from "@/services/recruitment";
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
            referralMethod: rawFormData.referral || null,
        };

        const trooper = await createTrooper(recruit, actorId);
        if (!trooper) {
            throw new Error("Failed to create trooper");
        }

        const log: NewRecruitmentLog = {
            trooperId: trooper.id,
            recruitedById: rawFormData.recruiter_name || null,
            referredById: rawFormData.referred_by || null,
            referralMethod: rawFormData.referral || null,
            ageConfirmed: rawFormData.age,
            microphoneConfirmed: rawFormData.microphone,
        };

        await createRecruitmentLog(log);

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
