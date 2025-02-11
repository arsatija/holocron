import { NextRequest, NextResponse } from "next/server";
import { getTroopersDepartmentPositions } from "@/services/departments";

export async function GET(req: NextRequest) {
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
