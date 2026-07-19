import { NextResponse, NextRequest } from "next/server";
import { getAvailableDepartmentOptions } from "@/services/departments";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const trooperId = request.nextUrl.searchParams.get("trooperId");
    const positions = await getAvailableDepartmentOptions(trooperId ?? undefined);
    return NextResponse.json(positions);
}
