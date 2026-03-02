import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

const EXCLUSION_MINUTES = 210;
const SLOT_STEP = 30;
const TOTAL_SLOTS = (24 * 60) / SLOT_STEP; // 48 slots: 00:00 → 23:30

function timeToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
    try {
        const date = request.nextUrl.searchParams.get("date");
        if (!date) {
            return NextResponse.json({ error: "date is required" }, { status: 400 });
        }

        // Fetch all Operation-kind events on this date that have a time set
        // Uses eventKind filter (not innerJoin on operations) so series events
        // without briefs still block the exclusion zone
        const rows = await db
            .select({ eventTime: events.eventTime })
            .from(events)
            .where(
                and(
                    eq(events.eventDate, date),
                    eq(events.eventKind, "Operation"),
                    isNotNull(events.eventTime)
                )
            );

        const existingTimes = rows
            .map((r) => r.eventTime)
            .filter((t): t is string => t !== null);

        const existingMinutes = existingTimes.map(timeToMinutes);

        const available: string[] = [];

        for (let i = 0; i < TOTAL_SLOTS; i++) {
            const slotMin = i * SLOT_STEP;
            const blocked = existingMinutes.some(
                (opMin) => Math.abs(slotMin - opMin) < EXCLUSION_MINUTES
            );
            if (!blocked) {
                available.push(minutesToTime(slotMin));
            }
        }

        return NextResponse.json({ available, existingTimes });
    } catch (error) {
        console.error("Error fetching available times:", error);
        return NextResponse.json(
            { error: "Failed to fetch available times" },
            { status: 500 }
        );
    }
}
