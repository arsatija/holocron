import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { events, trainings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { completeTrainingEvent, linkCompletionToEvent } from "@/services/trainings";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/api-auth";

const TRAINING_PERMISSIONS = ["Training", "Company", "Command"];

async function getActorId(): Promise<string | undefined> {
    try {
        const cookieStore = await cookies();
        const raw = cookieStore.get("trooperCtx")?.value;
        if (!raw) return undefined;
        return JSON.parse(raw)?.id ?? undefined;
    } catch {
        return undefined;
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> },
) {
    const denied = await requirePermission(TRAINING_PERMISSIONS);
    if (denied) return denied;

    try {
        const { eventId } = await params;
        const body = await request.json();
        const traineeIds: string[] = body.traineeIds ?? [];
        const existingCompletionId: string | undefined = body.existingCompletionId;

        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            with: { trainingEvent: true },
        });

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 },
            );
        }

        if (event.eventKind !== "Training") {
            return NextResponse.json(
                { error: "Event is not a training event" },
                { status: 400 },
            );
        }

        if (!event.trainingEvent) {
            return NextResponse.json(
                { error: "Training event record not found" },
                { status: 400 },
            );
        }

        if (event.trainingEvent.trainingCompletionId) {
            return NextResponse.json(
                { error: "Training already completed" },
                { status: 400 },
            );
        }

        const actorId = await getActorId();

        if (existingCompletionId) {
            const result = await linkCompletionToEvent(event.trainingEvent.id, existingCompletionId);
            if ("error" in result) {
                return NextResponse.json({ error: result.error }, { status: 400 });
            }
            return NextResponse.json({ success: true, completionId: existingCompletionId });
        }

        const result = await completeTrainingEvent(
            event.trainingEvent.id,
            traineeIds,
            actorId,
        );

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            completionId: result.completionId,
        });
    } catch (error) {
        console.error("Error completing training event:", error);
        return NextResponse.json(
            { error: "Failed to complete training event" },
            { status: 500 },
        );
    }
}
