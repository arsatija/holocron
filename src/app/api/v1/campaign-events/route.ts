import { NextResponse, NextRequest } from "next/server";
import {
    getCampaignEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
} from "@/services/events";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaignId = request.nextUrl.searchParams.get("campaignId");
    const eventId = request.nextUrl.searchParams.get("eventId");

    // If querying by eventId, return a single event
    if (eventId) {
        try {
            const event = await getEventById(eventId);
            if (!event) {
                return NextResponse.json(
                    { error: "Event not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json(event);
        } catch (error) {
            console.error("Error fetching event:", error);
            return NextResponse.json(
                { error: "Failed to fetch event" },
                { status: 500 }
            );
        }
    }

    // Otherwise, query by campaignId
    if (!campaignId) {
        return NextResponse.json(
            { error: "Campaign ID is required" },
            { status: 400 }
        );
    }

    try {
        const events = await getCampaignEvents(campaignId);
        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching campaign events:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaign events" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const result = await createEvent(body, ctx.id);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ id: result.id }, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { id, ...payload } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const result = await updateEvent(id, payload, ctx.id);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Failed to update event" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
        return NextResponse.json(
            { error: "Event ID is required" },
            { status: 400 }
        );
    }

    try {
        const result = await deleteEvent(eventId, ctx.id);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 }
        );
    }
}
