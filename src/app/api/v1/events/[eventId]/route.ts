import { NextResponse, NextRequest } from "next/server";
import { updateEvent, deleteEvent, getEventById } from "@/services/events";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { eventId } = await params;
        const event = await getEventById(eventId);
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }
        return NextResponse.json(event);
    } catch {
        return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
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
        const result = await updateEvent(eventId, body, ctx.id);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { eventId } = await params;
        const result = await deleteEvent(eventId, ctx.id);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
