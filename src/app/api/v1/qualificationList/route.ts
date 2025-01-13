import { NextResponse } from "next/server";
import { getQualificationOptions } from "@/services/qualifications";

export async function GET() {
    const qualifications = await getQualificationOptions();
    return NextResponse.json(qualifications);
}
