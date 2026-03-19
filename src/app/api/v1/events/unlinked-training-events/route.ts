import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, trainings, qualifications } from "@/db/schema";
import { and, eq, isNull, lt, desc } from "drizzle-orm";
import { format } from "date-fns";

export async function GET() {
    try {
        const today = format(new Date(), "yyyy-MM-dd");

        const rows = await db
            .select({
                id: events.id,
                name: events.name,
                eventDate: events.eventDate,
                trainingEventId: trainings.id,
                qualificationId: trainings.qualificationId,
                qualificationName: qualifications.name,
                qualificationAbbreviation: qualifications.abbreviation,
            })
            .from(events)
            .innerJoin(trainings, eq(trainings.eventId, events.id))
            .leftJoin(qualifications, eq(trainings.qualificationId, qualifications.id))
            .where(
                and(
                    eq(events.eventKind, "Training"),
                    isNull(trainings.trainingCompletionId),
                    lt(events.eventDate, today),
                )
            )
            .orderBy(desc(events.eventDate))
            .limit(15);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching unlinked training events:", error);
        return NextResponse.json({ error: "Failed to fetch unlinked training events" }, { status: 500 });
    }
}
