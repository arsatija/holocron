import { NextRequest, NextResponse } from "next/server";
import { submitBioDraft, getPendingBioDraft } from "@/services/troopers";
import { db } from "@/db";
import { troopers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const trooperId = searchParams.get("trooperId");

    if (!trooperId) {
        return NextResponse.json({ error: "trooperId required" }, { status: 400 });
    }

    const draft = await getPendingBioDraft(trooperId);
    return NextResponse.json({ draft });
}

export async function PATCH(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trooperId, bio } = await request.json();

    if (!trooperId) {
        return NextResponse.json({ error: "trooperId is required" }, { status: 400 });
    }

    // Get current approved bio to snapshot as previousContent
    const trooper = await db.query.troopers.findFirst({
        where: eq(troopers.id, trooperId),
        columns: { bio: true },
    });

    const result = await submitBioDraft(trooperId, bio ?? "", ctx.id, trooper?.bio ?? null);

    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
}
