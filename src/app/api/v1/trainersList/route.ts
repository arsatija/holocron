import { NextResponse } from "next/server";
import { getTrainersAsOptions } from "@/services/training-completions";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const trainers = await getTrainersAsOptions();
    return NextResponse.json(trainers);
}
