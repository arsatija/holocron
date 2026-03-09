import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { events, operations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createOperationBrief, updateOperationBrief } from "@/services/events";
import { createAuditLog } from "@/services/audit";
import { cookies } from "next/headers";

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
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const actorId = await getActorId();
        const result = await createOperationBrief(eventId, body, actorId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create brief" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const actorId = await getActorId();
        const result = await updateOperationBrief(eventId, body, actorId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update brief" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const { isPublished } = await request.json();
        await db
            .update(operations)
            .set({ isPublished })
            .where(eq(operations.eventId, eventId));

        const actorId = await getActorId();
        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            columns: { name: true, eventDate: true },
        });
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "operation",
            entityId: eventId,
            entityLabel: event ? `${event.eventDate} ${event.name}` : undefined,
            newData: { isPublished },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update brief" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            columns: { name: true, eventDate: true },
        });
        await db.delete(operations).where(eq(operations.eventId, eventId));

        const actorId = await getActorId();
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "operation",
            entityId: eventId,
            entityLabel: event ? `${event.eventDate} ${event.name}` : undefined,
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete brief" }, { status: 500 });
    }
}
