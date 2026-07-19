import { NextResponse, NextRequest } from "next/server";
import { getTrooperQualifications } from "@/services/qualifications";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
