"use server";

import { db } from "@/db";
import { wikiPages, WikiPage } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAllWikiPages() {
    try {
        const pages = await db.select().from(wikiPages);

        return pages;
    } catch (error) {
        console.error("Error fetching wiki pages:", error);
        return [];
    }
}

export async function getWikiPageBySlug(
    slug: string
): Promise<WikiPage | null> {
    try {
        const page = await db
            .select()
            .from(wikiPages)
            .where(eq(wikiPages.slug, slug));
        return (page[0] as WikiPage) ?? null;
    } catch (error) {
        console.error("Error fetching wiki page:", error);
        return null;
    }
}
