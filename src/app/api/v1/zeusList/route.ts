import { NextResponse } from "next/server";
import { getZeusTroopersAsOptions } from "@/services/attendances";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const troopers = await getZeusTroopersAsOptions();
    return NextResponse.json(troopers);
}
