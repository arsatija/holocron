import { NextResponse, NextRequest } from "next/server";
import {
    getCampaignEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
} from "@/services/events";
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

export async function GET(request: NextRequest) {
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
    try {
        const body = await request.json();
        const actorId = await getActorId();
        const result = await createEvent(body, actorId);

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
    try {
        const body = await request.json();
        const { id, ...payload } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const actorId = await getActorId();
        const result = await updateEvent(id, payload, actorId);

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
    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
        return NextResponse.json(
            { error: "Event ID is required" },
            { status: 400 }
        );
    }

    try {
        const actorId = await getActorId();
        const result = await deleteEvent(eventId, actorId);

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
