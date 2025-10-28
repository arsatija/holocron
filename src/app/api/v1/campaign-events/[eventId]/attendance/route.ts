import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { campaignEventAttendances, troopers, billets, billetAssignments, unitElements } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;

    try {
        // Get attendances with trooper, billet, and unit information
        const attendances = await db
            .select({
                id: campaignEventAttendances.id,
                trooperId: campaignEventAttendances.trooperId,
                trooper: {
                    id: troopers.id,
                    name: troopers.name,
                    numbers: troopers.numbers,
                    rank: troopers.rank,
                },
                billetId: billetAssignments.billetId,
                billetRole: billets.role,
                unitElementName: unitElements.name,
                unitElementId: unitElements.id,
                unitElementPriority: unitElements.priority,
            })
            .from(campaignEventAttendances)
            .innerJoin(troopers, eq(campaignEventAttendances.trooperId, troopers.id))
            .leftJoin(billetAssignments, eq(troopers.id, billetAssignments.trooperId))
            .leftJoin(billets, eq(billetAssignments.billetId, billets.id))
            .leftJoin(unitElements, eq(billets.unitElementId, unitElements.id))
            .where(eq(campaignEventAttendances.campaignEventId, eventId));

        return NextResponse.json(attendances);
    } catch (error) {
        console.error("Error fetching event attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch event attendance" },
            { status: 500 }
        );
    }
}

