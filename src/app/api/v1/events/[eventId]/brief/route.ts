import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { operations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createOperationBrief, updateOperationBrief } from "@/services/events";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const result = await createOperationBrief(eventId, body);

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
        const result = await updateOperationBrief(eventId, body);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

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
        await db.delete(operations).where(eq(operations.eventId, eventId));

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete brief" }, { status: 500 });
    }
}
