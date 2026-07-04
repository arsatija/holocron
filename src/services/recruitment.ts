"use server";

import { db } from "@/db";
import { NewRecruitmentLog, recruitmentLogs } from "@/db/schema";

export async function createRecruitmentLog(log: NewRecruitmentLog) {
    try {
        const [result] = await db.insert(recruitmentLogs).values(log).returning();
        return result ?? null;
    } catch (error) {
        console.error("Failed to create recruitment log:", error);
        return null;
    }
}
