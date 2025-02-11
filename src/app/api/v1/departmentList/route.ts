import { NextResponse, NextRequest } from "next/server";
import { getAvailableDepartmentOptions } from "@/services/departments";

export async function GET(request: NextRequest) {
    const trooperId = request.nextUrl.searchParams.get("trooperId");
    const positions = await getAvailableDepartmentOptions(trooperId ?? undefined);
    return NextResponse.json(positions);
}
