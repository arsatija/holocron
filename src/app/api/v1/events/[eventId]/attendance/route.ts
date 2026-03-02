import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import {
    events,
    attendances,
    trooperAttendances,
    troopers,
    unitElements,
    billets,
    billetAssignments,
    NewAttendance,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { completeOperation, updateOperation } from "@/services/operations";
import { EventAttendanceData, TrooperBasicInfo } from "@/lib/types";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    try {
        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            with: { operation: true },
        });

        if (!event || !event.operation?.attendanceId) {
            return NextResponse.json({ zeus: null, coZeus: [], attendances: [], allUnits: [] });
        }

        const attendanceRecord = await db.query.attendances.findFirst({
            where: eq(attendances.id, event.operation.attendanceId),
        });

        if (!attendanceRecord) {
            return NextResponse.json({ zeus: null, coZeus: [], attendances: [], allUnits: [] });
        }

        const trooperAttendanceList = await db
            .select({
                id: trooperAttendances.id,
                trooperId: trooperAttendances.trooperId,
                trooper: troopers,
            })
            .from(trooperAttendances)
            .innerJoin(troopers, eq(trooperAttendances.trooperId, troopers.id))
            .where(eq(trooperAttendances.attendanceId, attendanceRecord.id));

        const attendancesData: EventAttendanceData[] = await Promise.all(
            trooperAttendanceList.map(async (ta) => {
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
                    billetPriority: billetInfo?.billetPriority ?? 999,
                    unitElementName: billetInfo?.unitElementName || null,
                    unitElementParentId: billetInfo?.unitElementParentId || null,
                    unitElementId: billetInfo?.unitElementId || null,
                    unitElementPriority: billetInfo?.unitElementPriority || null,
                } as EventAttendanceData;
            })
        );

        let zeusData: TrooperBasicInfo | null = null;
        if (attendanceRecord.zeusId) {
            const zeus = await db
                .select({ id: troopers.id, name: troopers.name, numbers: troopers.numbers, rank: troopers.rank })
                .from(troopers)
                .where(eq(troopers.id, attendanceRecord.zeusId));
            zeusData = zeus[0] || null;
        }

        let coZeusData: TrooperBasicInfo[] = [];
        if (attendanceRecord.coZeusIds && attendanceRecord.coZeusIds.length > 0) {
            coZeusData = await db
                .select({ id: troopers.id, name: troopers.name, numbers: troopers.numbers, rank: troopers.rank })
                .from(troopers)
                .where(inArray(troopers.id, attendanceRecord.coZeusIds));
        }

        const allUnits = await db
            .select({ id: unitElements.id, name: unitElements.name, parentId: unitElements.parentId, priority: unitElements.priority })
            .from(unitElements);

        return NextResponse.json({ zeus: zeusData, coZeus: coZeusData, attendances: attendancesData, allUnits });
    } catch (error) {
        console.error("Error fetching event attendance:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

const logSchema = z.object({
    zeusId: z.string().uuid().nullable().optional(),
    coZeusIds: z.array(z.string().uuid()).default([]),
    trooperIds: z.array(z.string().uuid()).default([]),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const { zeusId, coZeusIds, trooperIds } = logSchema.parse(body);

        const event = await db.query.events.findFirst({
            where: eq(events.id, eventId),
            with: { operation: true },
        });

        if (!event || !event.operation) {
            return NextResponse.json({ error: "Operation not found" }, { status: 404 });
        }
        if (event.operation.attendanceId) {
            return NextResponse.json({ error: "Attendance already logged" }, { status: 400 });
        }

        const opType = event.operation.operationType ?? "Main";
        const result = await completeOperation(
            event.operation.id,
            zeusId ?? "",
            coZeusIds,
            trooperIds,
            event.eventDate,
            opType as "Main" | "Skirmish" | "Fun" | "Raid" | "Joint" | "Training",
        );

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, attendanceId: result.attendanceId });
    } catch (error) {
        console.error("Error logging attendance:", error);
        return NextResponse.json({ error: "Failed to log attendance" }, { status: 500 });
    }
}

const updateSchema = z.object({
    attendanceId: z.string().uuid(),
    zeusId: z.string().uuid().nullable().optional(),
    coZeusIds: z.array(z.string().uuid()).default([]),
    trooperIds: z.array(z.string().uuid()).default([]),
});

export async function PUT(
    request: NextRequest,
    _context: { params: Promise<{ eventId: string }> }
) {
    try {
        const body = await request.json();
        const { attendanceId, zeusId, coZeusIds, trooperIds } = updateSchema.parse(body);

        const attendanceUpdate: NewAttendance = {
            id: attendanceId,
            zeusId: zeusId ?? null,
            coZeusIds,
        };

        const result = await updateOperation(attendanceUpdate, trooperIds);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating attendance:", error);
        return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
    }
}
