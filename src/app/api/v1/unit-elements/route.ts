import { NextResponse } from "next/server";
import { db } from "@/db";
import { unitElements } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
    try {
        const elements = await db
            .select({ id: unitElements.id, name: unitElements.name })
            .from(unitElements)
            .orderBy(asc(unitElements.priority), asc(unitElements.name));

        return NextResponse.json(elements);
    } catch {
        return NextResponse.json({ error: "Failed to fetch unit elements" }, { status: 500 });
    }
}
