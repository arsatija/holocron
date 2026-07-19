import { NextResponse } from "next/server";
import { getTroopersAsOptions } from "@/services/troopers";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const troopers = await getTroopersAsOptions();
    return NextResponse.json(troopers);
}