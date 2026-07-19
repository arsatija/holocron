import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { qualifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/services/audit";
import { getTrooperCtx } from "@/services/trooper-ctx";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ctx = await getTrooperCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { description } = body;

    try {
        const previous = await db.query.qualifications.findFirst({
            where: eq(qualifications.id, id),
        });

        const [updated] = await db
            .update(qualifications)
            .set({ description })
            .where(eq(qualifications.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: "Qualification not found" },
                { status: 404 }
            );
        }

        revalidateTag("qualifications");

        await createAuditLog({
            actorId: ctx.id,
            action: "UPDATE",
            entityType: "trooper_qualification",
            entityId: id,
            entityLabel: `${updated.abbreviation} — ${updated.name}`,
            previousData: { description: previous?.description },
            newData: { description: updated.description },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating qualification:", error);
        return NextResponse.json(
            { error: "Failed to update qualification" },
            { status: 500 }
        );
    }
}
