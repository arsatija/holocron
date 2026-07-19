import { NextResponse, NextRequest } from "next/server";
import { createSeries, getActiveSeries, updateSeries, deactivateSeries, ensureSeriesExtended } from "@/services/event-series";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await ensureSeriesExtended();
        const series = await getActiveSeries();
        return NextResponse.json({ series });
    } catch {
        return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const result = await createSeries(body, ctx.id);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create series" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { seriesId, ...payload } = await request.json();
        if (!seriesId) {
            return NextResponse.json({ error: "seriesId required" }, { status: 400 });
        }

        const result = await updateSeries(seriesId, payload, ctx.id);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to update series" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { seriesId } = await request.json();
        if (!seriesId) {
            return NextResponse.json({ error: "seriesId required" }, { status: 400 });
        }

        const result = await deactivateSeries(seriesId, ctx.id);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to deactivate series" }, { status: 500 });
    }
}
