import { NextRequest, NextResponse } from "next/server";
import { submitBioDraft, getPendingBioDraft } from "@/services/troopers";
import { db } from "@/db";
import { troopers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const trooperId = searchParams.get("trooperId");

    if (!trooperId) {
        return NextResponse.json({ error: "trooperId required" }, { status: 400 });
    }

    const draft = await getPendingBioDraft(trooperId);
    return NextResponse.json({ draft });
}

export async function PATCH(request: NextRequest) {
    const { trooperId, bio, submittedById } = await request.json();

    if (!trooperId || !submittedById) {
        return NextResponse.json({ error: "trooperId and submittedById are required" }, { status: 400 });
    }

    // Get current approved bio to snapshot as previousContent
    const trooper = await db.query.troopers.findFirst({
        where: eq(troopers.id, trooperId),
        columns: { bio: true },
    });

    const result = await submitBioDraft(trooperId, bio ?? "", submittedById, trooper?.bio ?? null);

    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
}
