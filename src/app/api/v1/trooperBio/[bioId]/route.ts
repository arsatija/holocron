import { NextRequest, NextResponse } from "next/server";
import { approveBioDraft, rejectBioDraft } from "@/services/troopers";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ bioId: string }> }
) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bioId } = await params;
    const { action } = await request.json();

    const result =
        action === "approve"
            ? await approveBioDraft(bioId, ctx.id)
            : await rejectBioDraft(bioId, ctx.id);

    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
