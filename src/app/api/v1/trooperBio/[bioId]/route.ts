import { NextRequest, NextResponse } from "next/server";
import { approveBioDraft, rejectBioDraft } from "@/services/troopers";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ bioId: string }> }
) {
    const { bioId } = await params;
    const { action, moderatorId } = await request.json();

    if (!moderatorId) {
        return NextResponse.json({ error: "moderatorId required" }, { status: 400 });
    }

    const result =
        action === "approve"
            ? await approveBioDraft(bioId, moderatorId)
            : await rejectBioDraft(bioId, moderatorId);

    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
