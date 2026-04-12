import { NextResponse, NextRequest } from "next/server";
import {
    getCampaignPhases,
    createCampaignPhase,
    updateCampaignPhase,
    deleteCampaignPhase,
} from "@/services/campaigns";
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

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const phases = await getCampaignPhases(id);
        return NextResponse.json(phases);
    } catch (error) {
        console.error("Error fetching phases:", error);
        return NextResponse.json(
            { error: "Failed to fetch phases" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const actorId = await getActorId();
        const result = await createCampaignPhase({
            ...body,
            campaignId: id,
        }, actorId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating phase:", error);
        return NextResponse.json(
            { error: "Failed to create phase" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Phase ID is required" },
                { status: 400 }
            );
        }

        const actorId = await getActorId();
        const result = await updateCampaignPhase(id, data, actorId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating phase:", error);
        return NextResponse.json(
            { error: "Failed to update phase" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    const phaseId = request.nextUrl.searchParams.get("phaseId");
    if (!phaseId) {
        return NextResponse.json(
            { error: "Phase ID is required" },
            { status: 400 }
        );
    }

    try {
        const actorId = await getActorId();
        const result = await deleteCampaignPhase(phaseId, actorId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error deleting phase:", error);
        return NextResponse.json(
            { error: "Failed to delete phase" },
            { status: 500 }
        );
    }
}
