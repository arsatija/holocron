import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { events, trainingEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { completeTrainingEvent } from "@/services/trainings";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const traineeIds: string[] = body.traineeIds ?? [];

        // Fetch the event to confirm it's a Training event
        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            with: { trainingEvent: true },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.eventKind !== "Training") {
            return NextResponse.json(
                { error: "Event is not a training event" },
                { status: 400 }
            );
        }

        if (!event.trainingEvent) {
            return NextResponse.json(
                { error: "Training event record not found" },
                { status: 400 }
            );
        }

        if (event.trainingEvent.trainingCompletionId) {
            return NextResponse.json(
                { error: "Training already completed" },
                { status: 400 }
            );
        }

        const result = await completeTrainingEvent(event.trainingEvent.id, traineeIds);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, completionId: result.completionId });
    } catch (error) {
        console.error("Error completing training event:", error);
        return NextResponse.json(
            { error: "Failed to complete training event" },
            { status: 500 }
        );
    }
}
