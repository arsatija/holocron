import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { events, operations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createOperationBrief, updateOperationBrief } from "@/services/events";
import { createAuditLog } from "@/services/audit";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { eventId } = await params;
        const body = await request.json();
        const result = await createOperationBrief(eventId, body, ctx.id);

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
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { eventId } = await params;
        const body = await request.json();
        const result = await updateOperationBrief(eventId, body, ctx.id);

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
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { eventId } = await params;
        const { isPublished } = await request.json();
        await db
            .update(operations)
            .set({ isPublished })
            .where(eq(operations.eventId, eventId));

        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            columns: { name: true, eventDate: true },
        });
        await createAuditLog({
            actorId: ctx.id,
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
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { eventId } = await params;
        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            columns: { name: true, eventDate: true },
        });
        await db.delete(operations).where(eq(operations.eventId, eventId));

        await createAuditLog({
            actorId: ctx.id,
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
