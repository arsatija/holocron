import { NextResponse, NextRequest } from "next/server";
import {
    getCampaignDetail,
    updateCampaign,
    deleteCampaign,
} from "@/services/campaigns";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    try {
        const campaign = await getCampaignDetail(id);
        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(campaign);
    } catch (error) {
        console.error("Error fetching campaign:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaign" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const result = await updateCampaign(body, ctx.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating campaign:", error);
        return NextResponse.json(
            { error: "Failed to update campaign" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    try {
        const result = await deleteCampaign(id, ctx.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return NextResponse.json(
            { error: "Failed to delete campaign" },
            { status: 500 }
        );
    }
}
