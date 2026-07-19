import { NextResponse } from "next/server";
import { getRanksAsOptions } from "@/services/ranks";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ranks = await getRanksAsOptions();
    return NextResponse.json(ranks);
}
