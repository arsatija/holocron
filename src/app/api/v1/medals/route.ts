import { NextResponse } from "next/server";
import { getMedals } from "@/services/medals";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await getMedals();
    return NextResponse.json(data);
}
