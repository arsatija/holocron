import { NextResponse } from "next/server";
import { getTroopersAsOptions } from "@/services/troopers";

export async function GET() {
    const troopers = await getTroopersAsOptions();
    return NextResponse.json(troopers);
}