import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wikiPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
    try {
        const { title } = await req.json();

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        // Create a slug from the title
        let slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const existingSlug = await db
            .select()
            .from(wikiPages)
            .where(eq(wikiPages.slug, slug));
        if (existingSlug.length > 0) {
            slug = slug + "-" + nanoid(5);
        }

        const newPage = await db
            .insert(wikiPages)
            .values({
                title,
                slug,
                content: "", // Empty content for new pages
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return NextResponse.json(newPage[0]);
    } catch (error) {
        console.error("Error creating wiki page:", error);
        return NextResponse.json(
            { error: "Failed to create wiki page" },
            { status: 500 }
        );
    }
}
