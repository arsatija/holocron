"use server";

import { db } from "@/db";
import {
    attendances,
    NewAttendance,
    qualifications,
    trooperAttendances,
    trooperQualifications,
    troopers,
} from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { eq, not, sql, and, asc, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

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
    const ops = await db
        .select({
            id: attendances.id,
            eventDate: attendances.eventDate,
            zeusId: attendances.zeusId,
            eventType: attendances.eventType,
            eventNotes: attendances.eventNotes,
        })
        .from(attendances)
        .innerJoin(
            trooperAttendances,
            eq(trooperAttendances.attendanceId, attendances.id)
        )
        .where(eq(trooperAttendances.trooperId, trooperId));
    return ops;
}

export async function populateTrooperAttendances(trooperId: string) {
    const trooperAttendances = await getAttendancesByTrooperId(trooperId);
    const ops = trooperAttendances.map((attendance) => {
        return attendance.eventDate;
    });
    return ops;
}

export interface NewAttendanceWithTroopers extends NewAttendance {
    trooperIds: string[];
}

export async function createAttendance(attendance: NewAttendanceWithTroopers) {
    try {
        const result = await db.transaction(async (tx) => {
            const attendanceInfo = {
                zeusId: attendance.zeusId,
                coZeusIds: attendance.coZeusIds,
                eventDate: attendance.eventDate,
                eventType: attendance.eventType,
                eventNotes: attendance.eventNotes,
            };

            const newAttendance = await tx
                .insert(attendances)
                .values(attendanceInfo)
                .returning();

            if (newAttendance.length === 0) {
                throw new Error("Failed to create attendance");
            }

            await tx.insert(trooperAttendances).values(
                attendance.trooperIds.map((trooper) => ({
                    trooperId: trooper,
                    attendanceId: newAttendance[0].id,
                }))
            );

            // Update each trooper's status to "Active" and increase their attendance count
            await tx
                .update(troopers)
                .set({ status: "Active" })
                .where(inArray(troopers.id, attendance.trooperIds));

            return newAttendance[0].id;
        });
        revalidateTag("roster");
        return { success: true, id: result };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create attendance" };
    }
}

export async function updateAttendance(attendance: NewAttendanceWithTroopers) {}

export async function deleteAttendance(attendanceId: string) {
    try {
        const result = await db.transaction(async (tx) => {
            const trooperIds = await tx.query.trooperAttendances.findMany({
                where: eq(trooperAttendances.attendanceId, attendanceId),
                columns: {
                    trooperId: true,
                },
            });

            await tx
                .delete(attendances)
                .where(eq(attendances.id, attendanceId));
        });

        revalidateTag("roster");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to delete attendance" };
    }
}

export async function getZeusQualifiedTroopers() {
    try {
        const zeusQualifiedTroopers = await db
            .select({
                id: troopers.id,
                name: troopers.name,
                rank: troopers.rank,
                numbers: troopers.numbers,
            })
            .from(troopers)
            .innerJoin(
                trooperQualifications,
                eq(troopers.id, trooperQualifications.trooperId)
            )
            .innerJoin(
                qualifications,
                eq(trooperQualifications.qualificationId, qualifications.id)
            )
            .where(
                and(
                    not(eq(troopers.status, "Discharged")),
                    eq(qualifications.abbreviation, "ZEUS")
                )
            )
            .orderBy(asc(troopers.rank));

        return zeusQualifiedTroopers;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getZeusTroopersAsOptions() {
    const troopers = await getZeusQualifiedTroopers();
    return troopers.map((trooper) => ({
        value: trooper.id,
        label: getFullTrooperName(trooper),
    }));
}

export async function getAttendancesForTrooper(trooperId: string) {
    try {
        const ops = await db.query.trooperAttendances.findMany({
            where: eq(trooperAttendances.trooperId, trooperId),
        });
        return ops;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getAttendanceCountForTrooper(trooperId: string) {
    try {
        const ops = await getAttendancesForTrooper(trooperId);
        return ops.length;
    } catch (error) {
        console.error(error);
        return 0;
    }
}
