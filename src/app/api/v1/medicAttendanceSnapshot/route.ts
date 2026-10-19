import { NextResponse } from "next/server";
import { getMedicAttendanceSnapshot } from "@/services/medic-attendances";

export async function GET() {
    const snapshot = await getMedicAttendanceSnapshot();
    return NextResponse.json(snapshot);
}