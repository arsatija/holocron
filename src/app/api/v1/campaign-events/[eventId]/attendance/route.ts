import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { troopers, billets, billetAssignments, unitElements, attendances, trooperAttendances, campaignEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;

    try {
        // First, get the event to find its attendanceId
        const event = await db.query.campaignEvents.findFirst({
            where: eq(campaignEvents.id, eventId),
        });

        if (!event || !event.attendanceId) {
            return NextResponse.json([]);
        }

        const attendanceRecord = await db.query.attendances.findFirst({
            where: eq(attendances.id, event.attendanceId),
        });

        if (!attendanceRecord) {
            return NextResponse.json([]);
        }

        // Get trooper attendances for this attendance record
        const trooperAttendanceList = await db
            .select({
                id: trooperAttendances.id,
                trooperId: trooperAttendances.trooperId,
                trooper: troopers,
            })
            .from(trooperAttendances)
            .innerJoin(troopers, eq(trooperAttendances.trooperId, troopers.id))
            .where(eq(trooperAttendances.attendanceId, attendanceRecord.id));

        // Get billet and unit information for each trooper
        const attendancesData = await Promise.all(
            trooperAttendanceList.map(async (ta) => {
                // Get billet assignment for this trooper
                const billetAssignment = await db
                    .select({
                        billetId: billetAssignments.billetId,
                        billetRole: billets.role,
                        unitElementName: unitElements.name,
                        unitElementId: unitElements.id,
                        unitElementPriority: unitElements.priority,
                    })
                    .from(billetAssignments)
                    .innerJoin(billets, eq(billetAssignments.billetId, billets.id))
                    .leftJoin(unitElements, eq(billets.unitElementId, unitElements.id))
                    .where(eq(billetAssignments.trooperId, ta.trooper.id))
                    .limit(1);

                const billetInfo = billetAssignment[0] || null;

                return {
                    id: ta.id,
                    trooperId: ta.trooper.id,
                    trooper: {
                        id: ta.trooper.id,
                        name: ta.trooper.name,
                        numbers: ta.trooper.numbers,
                        rank: ta.trooper.rank,
                    },
                    billetId: billetInfo?.billetId || null,
                    billetRole: billetInfo?.billetRole || null,
                    unitElementName: billetInfo?.unitElementName || null,
                    unitElementId: billetInfo?.unitElementId || null,
                    unitElementPriority: billetInfo?.unitElementPriority || null,
                };
            })
        );

        return NextResponse.json(attendancesData);
    } catch (error) {
        console.error("Error fetching event attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch event attendance" },
            { status: 500 }
        );
    }
}

