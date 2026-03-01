"use server";

import { db } from "@/db";
import {
    announcements,
    Announcement,
    NewAnnouncement,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { unstable_cache } from "@/lib/unstable-cache";

export async function getAnnouncements(): Promise<Announcement[]> {
    return unstable_cache(
        async () => {
            return db.query.announcements.findMany({
                orderBy: [desc(announcements.isImportant), desc(announcements.createdAt)],
            });
        },
        ["announcements"],
        { tags: ["announcements"], revalidate: 60 }
    )();
}

export async function createAnnouncement(data: NewAnnouncement) {
    try {
        const result = await db.insert(announcements).values(data).returning();
        revalidateTag("announcements");
        return { success: true, id: result[0].id };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { error: "Failed to create announcement" };
    }
}

export async function updateAnnouncement(id: string, data: Partial<NewAnnouncement>) {
    try {
        await db.update(announcements).set(data).where(eq(announcements.id, id));
        revalidateTag("announcements");
        return { success: true };
    } catch (error) {
        console.error("Error updating announcement:", error);
        return { error: "Failed to update announcement" };
    }
}

export async function deleteAnnouncement(id: string) {
    try {
        await db.delete(announcements).where(eq(announcements.id, id));
        revalidateTag("announcements");
        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return { error: "Failed to delete announcement" };
    }
}
