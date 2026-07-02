import { NextResponse } from "next/server";
import { getMedals } from "@/services/medals";

export async function GET() {
    const data = await getMedals();
    return NextResponse.json(data);
}
