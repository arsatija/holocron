import { NextRequest, NextResponse } from "next/server";
import { getTroopersBillet } from "@/services/billets";

export async function GET(req: NextRequest) {
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
