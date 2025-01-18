import { NextRequest, NextResponse } from "next/server";

import { getTrooperAccount } from "@/services/troopers";


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const trooperId = searchParams.get("trooperId");
    if (!trooperId) {
        return NextResponse.json({ error: "Trooper ID is required" }, { status: 400 });
    }
    const user = await getTrooperAccount(trooperId);
    return NextResponse.json(user);
}