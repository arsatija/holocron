import { NextResponse } from "next/server";
import { getRanksAsOptions } from "@/services/ranks";

export async function GET() {
    const ranks = await getRanksAsOptions();
    return NextResponse.json(ranks);
}
