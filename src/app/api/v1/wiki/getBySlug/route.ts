import { NextRequest, NextResponse } from "next/server";
import { getWikiPageBySlug } from "@/services/wiki";

export async function GET(req: NextRequest) {
    try {
        const slug = req.nextUrl.searchParams.get("slug");
        if (!slug) {
            return NextResponse.json(
                { error: "Slug is required" },
                { status: 400 }
            );
        }

        const page = await getWikiPageBySlug(slug);
        if (!page) {
            return NextResponse.json(
                { error: "Page not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error("Error fetching wiki page:", error);
        return NextResponse.json(
            { error: "Failed to fetch wiki page" },
            { status: 500 }
        );
    }
}
