import { NextResponse } from "next/server";
import { getZeusTroopersAsOptions } from "@/services/attendances";

export async function GET() {
    const troopers = await getZeusTroopersAsOptions();
    return NextResponse.json(troopers);
}
