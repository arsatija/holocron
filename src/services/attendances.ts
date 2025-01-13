import { db } from "@/db";
import { attendances, NewAttendance, trooperAttendances } from "@/db/schema";
import { eq } from "drizzle-orm";


export default async function getAttendances() {
    const attendances = await db.query.attendances.findMany();
    return attendances;
}


export async function getAttendanceById(id: string) {
    const attendance = await db.query.attendances.findFirst({
        where: eq(attendances.id, id),
    });
    return attendance;
}

export async function getAttendancesByZeusId(zeusId: string) {
    const ops = await db.query.attendances.findMany({
        where: eq(attendances.zeusId, zeusId),
    });
    return ops;
}

export async function getAttendancesByTrooperId(trooperId: string) {
    const ops = await db.select({
        id: attendances.id,
        eventDate: attendances.eventDate,
        zeusId: attendances.zeusId,
        eventName: attendances.eventName,
    }).from(attendances).innerJoin(trooperAttendances, eq(trooperAttendances.attendanceId, attendances.id)).where(eq(trooperAttendances.trooperId, trooperId));
    return ops;
}

export async function populateTrooperAttendances(trooperId: string) {
    const trooperAttendances = await getAttendancesByTrooperId(trooperId);
    const ops = trooperAttendances.map(attendance => {
        return attendance.eventDate;
    });
    return ops;
}

export interface NewAttendanceWithTroopers extends NewAttendance {
    troopers: string[];
}

export async function createAttendance(attendance: NewAttendanceWithTroopers) {
    try {
        const result = await db.transaction(async tx => {

        const attendanceInfo = {
            zeusId: attendance.zeusId,
            coZeusIds: attendance.coZeusIds,
            eventDate: attendance.eventDate,
            eventName: attendance.eventName
        };

        const newAttendance = await tx.insert(attendances).values(attendanceInfo).returning();

        if (newAttendance.length === 0) {
            throw new Error("Failed to create attendance");
        }

        await tx.insert(trooperAttendances).values(attendance.troopers.map(trooper => ({
            trooperId: trooper,
            attendanceId: newAttendance[0].id
        })));
        return newAttendance[0].id;
    });
        return {success: true, id: result};
    } catch (error) {
        console.error(error);
        return { error: "Failed to create attendance" };
    }
}