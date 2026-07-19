import { NextRequest, NextResponse } from "next/server";
import { getTroopersBillet } from "@/services/billets";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(req: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const trooperId = req.nextUrl.searchParams.get("trooperId");
    if (!trooperId) {
        return NextResponse.json(
            { error: "Trooper ID is required" },
            { status: 400 }
        );
    }
    const billet = await getTroopersBillet(trooperId);
    return NextResponse.json({billet});
}
