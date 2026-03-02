import { NextResponse } from "next/server";
import { getTrainersAsOptions } from "@/services/training-completions";

export async function GET() {
    const trainers = await getTrainersAsOptions();
    return NextResponse.json(trainers);
}
