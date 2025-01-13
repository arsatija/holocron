import { NextResponse, NextRequest } from "next/server";
import { getTrooperQualifications } from "@/services/qualifications";

export async function GET(request: NextRequest) {
    const trooperId = request.nextUrl.searchParams.get("trooperId");
    if (!trooperId) {
        return NextResponse.json(
            { error: "Trooper ID is required" },
            { status: 400 }
        );
    }
    const qualifications = await getTrooperQualifications(trooperId);
    return NextResponse.json(qualifications);
}
