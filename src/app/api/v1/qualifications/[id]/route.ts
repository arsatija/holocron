import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { qualifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { description } = body;

    try {
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
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating qualification:", error);
        return NextResponse.json(
            { error: "Failed to update qualification" },
            { status: 500 }
        );
    }
}
