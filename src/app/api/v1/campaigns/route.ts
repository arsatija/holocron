import { NextResponse, NextRequest } from "next/server";
import { getCampaigns, createCampaign, updateCampaign } from "@/services/campaigns";
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
    try {
        const body = await request.json();
        const actorId = await getActorId();
        const result = await createCampaign(body, actorId);

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
    try {
        const body = await request.json();
        const actorId = await getActorId();
        const result = await updateCampaign(body, actorId);

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
