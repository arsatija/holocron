import { NextRequest, NextResponse } from "next/server";
import { getMedalsByTrooperId, awardMedal, revokeMedal } from "@/services/medals";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(req: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trooperId = req.nextUrl.searchParams.get("trooperId");
    if (!trooperId) return NextResponse.json({ error: "trooperId required" }, { status: 400 });
    const data = await getMedalsByTrooperId(trooperId);
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trooperId, medalId } = await req.json();
    if (!trooperId || !medalId) return NextResponse.json({ error: "trooperId and medalId required" }, { status: 400 });
    const row = await awardMedal(trooperId, medalId);
    return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { trooperId, medalId } = await req.json();
    if (!trooperId || !medalId) return NextResponse.json({ error: "trooperId and medalId required" }, { status: 400 });
    await revokeMedal(trooperId, medalId);
    return NextResponse.json({ success: true });
}
