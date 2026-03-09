import { NextResponse, NextRequest } from "next/server";
import { createSeries, getActiveSeries, updateSeries, deactivateSeries, ensureSeriesExtended } from "@/services/event-series";
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

export async function GET() {
    try {
        await ensureSeriesExtended();
        const series = await getActiveSeries();
        return NextResponse.json({ series });
    } catch {
        return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const actorId = await getActorId();
        const result = await createSeries(body, actorId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create series" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { seriesId, ...payload } = await request.json();
        if (!seriesId) {
            return NextResponse.json({ error: "seriesId required" }, { status: 400 });
        }

        const actorId = await getActorId();
        const result = await updateSeries(seriesId, payload, actorId);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update series" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { seriesId } = await request.json();
        if (!seriesId) {
            return NextResponse.json({ error: "seriesId required" }, { status: 400 });
        }

        const actorId = await getActorId();
        const result = await deactivateSeries(seriesId, actorId);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to deactivate series" }, { status: 500 });
    }
}
