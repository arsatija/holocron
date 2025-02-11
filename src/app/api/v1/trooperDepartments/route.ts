import { NextResponse, NextRequest } from "next/server";
import { getTrooperDepartments } from "@/services/departments";

export async function GET(request: NextRequest) {
    const trooperId = request.nextUrl.searchParams.get("trooperId");
    if (!trooperId) {
        return NextResponse.json(
            { error: "Trooper ID is required" },
            { status: 400 }
        );
    }
    const departments = await getTrooperDepartments(trooperId);
    return NextResponse.json(departments);
}
