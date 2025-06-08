import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wikiPages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const { slug, title, content } = await req.json();

        if (!slug || !title || !content) {
            return NextResponse.json(
                { error: "Slug, title and content are required" },
                { status: 400 }
            );
        }

        const updatedPage = await db
            .update(wikiPages)
            .set({
                title,
                content,
                updatedAt: new Date(),
            })
            .where(eq(wikiPages.slug, slug))
            .returning();

        return NextResponse.json(updatedPage[0]);
    } catch (error) {
        console.error("Error updating wiki page:", error);
        return NextResponse.json(
            { error: "Failed to create wiki page" },
            { status: 500 }
        );
    }
}
