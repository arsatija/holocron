import { NextResponse, NextRequest } from "next/server";
import { createSeries, getActiveSeries, deactivateSeries, ensureSeriesExtended } from "@/services/event-series";

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
        const result = await createSeries(body);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create series" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { seriesId } = await request.json();
        if (!seriesId) {
            return NextResponse.json({ error: "seriesId required" }, { status: 400 });
        }

        const result = await deactivateSeries(seriesId);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to deactivate series" }, { status: 500 });
    }
}
