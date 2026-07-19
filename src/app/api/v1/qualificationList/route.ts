import { NextResponse } from "next/server";
import { getQualificationOptions } from "@/services/qualifications";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const qualifications = await getQualificationOptions();
    return NextResponse.json(qualifications);
}
