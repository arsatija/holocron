import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import {
    troopers,
    billets,
    billetAssignments,
    unitElements,
    attendances,
    trooperAttendances,
    events,
    operations,
    NewAttendance,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { EventAttendanceData, TrooperBasicInfo } from "@/lib/types";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;

    try {
        // Get the event with its operation child
        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            with: { operation: true },
        });

        if (!event || !event.operation?.attendanceId) {
            return NextResponse.json([]);
        }

        const attendanceRecord = await db.query.attendances.findFirst({
            where: eq(attendances.id, event.operation.attendanceId),
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
        const [attendancesData, zeusData, coZeusData] = await Promise.all([
            Promise.all(
                trooperAttendanceList.map(
                    async (ta): Promise<EventAttendanceData> => {
                        const billetAssignment = await db
                            .select({
                                billetId: billetAssignments.billetId,
                                billetRole: billets.role,
                                billetPriority: billets.priority,
                                unitElementName: unitElements.name,
                                unitElementId: unitElements.id,
                                unitElementPriority: unitElements.priority,
                                unitElementParentId: unitElements.parentId,
                            })
                            .from(billetAssignments)
                            .innerJoin(
                                billets,
                                eq(billetAssignments.billetId, billets.id)
                            )
                            .leftJoin(
                                unitElements,
                                eq(billets.unitElementId, unitElements.id)
                            )
                            .where(
                                eq(billetAssignments.trooperId, ta.trooper.id)
                            )
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
                            billetPriority: billetInfo?.billetPriority ?? 999,
                            unitElementName: billetInfo?.unitElementName || null,
                            unitElementParentId: billetInfo?.unitElementParentId || null,
                            unitElementId: billetInfo?.unitElementId || null,
                            unitElementPriority: billetInfo?.unitElementPriority || null,
                        } as EventAttendanceData;
                    }
                )
            ),
            (async () => {
                if (attendanceRecord.zeusId) {
                    const zeus: TrooperBasicInfo[] = await db
                        .select({
                            id: troopers.id,
                            name: troopers.name,
                            numbers: troopers.numbers,
                            rank: troopers.rank,
                        })
                        .from(troopers)
                        .where(eq(troopers.id, attendanceRecord.zeusId));
                    return zeus[0] || null;
                }
                return null;
            })(),
            (async () => {
                if (attendanceRecord.coZeusIds && attendanceRecord.coZeusIds.length > 0) {
                    const coZeusInfos: TrooperBasicInfo[] = await db
                        .select({
                            id: troopers.id,
                            name: troopers.name,
                            numbers: troopers.numbers,
                            rank: troopers.rank,
                        })
                        .from(troopers)
                        .where(inArray(troopers.id, attendanceRecord.coZeusIds));
                    return coZeusInfos;
                }
                return [];
            })(),
        ]);

        // Fetch ALL unit elements to build complete hierarchy
        const allUnits = await db
            .select({
                id: unitElements.id,
                name: unitElements.name,
                parentId: unitElements.parentId,
                priority: unitElements.priority,
            })
            .from(unitElements);

        return NextResponse.json({
            zeus: zeusData,
            coZeus: coZeusData,
            attendances: attendancesData,
            allUnits: allUnits,
        });
    } catch (error) {
        console.error("Error fetching event attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch event attendance" },
            { status: 500 }
        );
    }
}

import { updateOperation } from "@/services/operations";
import { z } from "zod";

const updateSchema = z.object({
    attendanceId: z.string().uuid(),
    zeusId: z.string().uuid().nullable().optional(),
    coZeusIds: z.array(z.string().uuid()).optional(),
    trooperIds: z.array(z.string().uuid()).optional(),
});

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ eventId: string }> }
) {
    try {
        const body = await request.json();
        const {
            attendanceId,
            zeusId,
            coZeusIds = [],
            trooperIds = [],
        } = updateSchema.parse(body);

        const attendanceUpdate: NewAttendance = {
            id: attendanceId,
            zeusId,
            coZeusIds,
        };

        const { success, error } = await updateOperation(
            attendanceUpdate,
            trooperIds
        );

        if (error) {
            return NextResponse.json(
                { error: error?.toString() || "Failed to update attendance" },
                { status: 400 }
            );
        }
        return NextResponse.json({ success });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update attendance" },
            { status: 500 }
        );
    }
}
