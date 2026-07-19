import { NextRequest, NextResponse } from "next/server";
import { getTrooperCtx } from "@/services/trooper-ctx";
import { getWikiPage } from "@/services/wiki";
import { canEditCollection } from "@/services/wiki-permissions";
import { getWikiCollection } from "@/services/wiki";
import { autoSaveWikiPage } from "@/services/wiki";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pageId, title, content } = body;

        if (!pageId || typeof title !== "string" || typeof content !== "string") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const ctx = await getTrooperCtx();
        if (!ctx) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const page = await getWikiPage(pageId);
        if (!page) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        const collection = await getWikiCollection(page.collectionId);
        if (!collection || !canEditCollection(ctx, collection)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await autoSaveWikiPage(pageId, { title, content }, ctx.id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Auto-save failed" }, { status: 500 });
    }
}
