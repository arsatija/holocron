import { NextResponse, NextRequest } from "next/server";
import { getCampaigns, createCampaign, updateCampaign } from "@/services/campaigns";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const campaigns = await getCampaigns();
        return NextResponse.json(campaigns);
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaigns" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const result = await createCampaign(body, ctx.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json(
            { error: "Failed to create campaign" },
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
