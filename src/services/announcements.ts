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
import { createAuditLog } from "./audit";

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

export async function createAnnouncement(data: NewAnnouncement, actorId?: string) {
    try {
        const result = await db.insert(announcements).values(data).returning();
        revalidateTag("announcements");
        await createAuditLog({
            actorId,
            action: "CREATE",
            entityType: "announcement",
            entityId: result[0].id,
            entityLabel: result[0].title,
            newData: result[0] as unknown as Record<string, unknown>,
        });
        return { success: true, id: result[0].id };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { error: "Failed to create announcement" };
    }
}

export async function updateAnnouncement(id: string, data: Partial<NewAnnouncement>, actorId?: string) {
    try {
        const previous = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
        await db.update(announcements).set(data).where(eq(announcements.id, id));
        revalidateTag("announcements");
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "announcement",
            entityId: id,
            entityLabel: previous?.title,
            previousData: previous as unknown as Record<string, unknown>,
            newData: data as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating announcement:", error);
        return { error: "Failed to update announcement" };
    }
}

export async function deleteAnnouncement(id: string, actorId?: string) {
    try {
        const previous = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
        await db.delete(announcements).where(eq(announcements.id, id));
        revalidateTag("announcements");
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "announcement",
            entityId: id,
            entityLabel: previous?.title,
            previousData: previous as unknown as Record<string, unknown>,
        });
        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return { error: "Failed to delete announcement" };
    }
}
