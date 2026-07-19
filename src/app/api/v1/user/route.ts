import { NextRequest, NextResponse } from "next/server";
import { getTrooperAccount } from "@/services/troopers";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(req: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const trooperId = searchParams.get("trooperId");
    if (!trooperId) {
        return NextResponse.json({ error: "Trooper ID is required" }, { status: 400 });
    }
    const user = await getTrooperAccount(trooperId);
    return NextResponse.json(user);
}