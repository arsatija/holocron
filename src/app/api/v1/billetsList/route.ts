import { NextResponse, NextRequest } from "next/server";
import { getAvailableBilletOptions } from "@/services/billets";

export async function GET(request: NextRequest) {
    const trooperId = request.nextUrl.searchParams.get("trooperId");
    const ranks = await getAvailableBilletOptions(trooperId ?? undefined);
    return NextResponse.json(ranks);
}
