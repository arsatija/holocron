import { NextRequest, NextResponse } from "next/server";
import { getMedalsByTrooperId, awardMedal, revokeMedal } from "@/services/medals";

export async function GET(req: NextRequest) {
    const trooperId = req.nextUrl.searchParams.get("trooperId");
    if (!trooperId) return NextResponse.json({ error: "trooperId required" }, { status: 400 });
    const data = await getMedalsByTrooperId(trooperId);
    return NextResponse.json(data);
}

// TODO: Add server-side permission checks to POST and DELETE — currently auth is UI-only (ProtectedComponent).
// Only Command, Company, admin:2ic, and admin:lead should be able to award/revoke medals.
export async function POST(req: NextRequest) {
    const { trooperId, medalId } = await req.json();
    if (!trooperId || !medalId) return NextResponse.json({ error: "trooperId and medalId required" }, { status: 400 });
    const row = await awardMedal(trooperId, medalId);
    return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const { trooperId, medalId } = await req.json();
    if (!trooperId || !medalId) return NextResponse.json({ error: "trooperId and medalId required" }, { status: 400 });
    await revokeMedal(trooperId, medalId);
    return NextResponse.json({ success: true });
}
