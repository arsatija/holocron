import { NextRequest, NextResponse } from "next/server";
import { getTroopersDepartmentPositions } from "@/services/departments";
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
    const position = await getTroopersDepartmentPositions(trooperId);

    if (!position) {
        const response = NextResponse.json({ departmentPositions: [] });
        return response;
    }
    const positionStrings = position.map(p => p.positionId);
    const response = NextResponse.json({ departmentPositions: positionStrings });
    return response;
}
