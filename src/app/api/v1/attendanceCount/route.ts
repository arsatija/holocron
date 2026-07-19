import { NextRequest, NextResponse } from "next/server";
import { getAttendanceCountForTrooper } from "@/services/attendances";
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
    const attendanceCount = await getAttendanceCountForTrooper(trooperId);
    return NextResponse.json({ attendanceCount });
}
