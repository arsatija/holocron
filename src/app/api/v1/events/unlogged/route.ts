import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, operations } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { asc } from "drizzle-orm";

export async function GET() {
    try {
        const rows = await db
            .select({
                id: events.id,
                name: events.name,
                eventDate: events.eventDate,
                operationName: operations.operationName,
                operationType: operations.operationType,
            })
            .from(events)
            .innerJoin(operations, eq(operations.eventId, events.id))
            .where(isNull(operations.attendanceId))
            .orderBy(asc(events.eventDate));

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching unlogged operations:", error);
        return NextResponse.json({ error: "Failed to fetch unlogged operations" }, { status: 500 });
    }
}
