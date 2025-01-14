import { NextRequest, NextResponse } from "next/server";
import { getBilletInformation } from "@/services/billets";

export async function GET(req: NextRequest) {
    const trooperId = req.nextUrl.searchParams.get("trooperId");
    if (!trooperId) {
        return NextResponse.json(
            { error: "Trooper ID is required" },
            { status: 400 }
        );
    }
    const billet = await getBilletInformation(trooperId);
    return NextResponse.json({ billet });
}
