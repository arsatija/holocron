import "server-only";

import { db } from "@/db";
import {
    troopers,
    qualifications,
    attendances,
    trooperAttendances,
} from "@/db/schema";
import {
    and,
    asc,
    count,
    desc,
    gte,
    eq,
    inArray,
    lte,
    ilike,
    or,
    arrayContains,
} from "drizzle-orm";
import { filterColumns } from "@/lib/filter-columns";
import { unstable_cache } from "@/lib/unstable-cache";
import { type GetOperationsSchema } from "./validations";
import { OperationEntry, TrainingEntry } from "@/lib/types";

export async function getOperations(input: GetOperationsSchema) {
    return await unstable_cache(
        async () => {
            try {
                const offset = (input.page - 1) * input.perPage;
                const fromDate = input.from ? new Date(input.from) : undefined;
                const toDate = input.to ? new Date(input.to) : undefined;
                const advancedTable = input.flags.includes("advancedTable");

                const advancedWhere = filterColumns({
                    table: attendances,
                    filters: input.filters,
                    joinOperator: input.joinOperator,
                });

                const where = advancedTable
                    ? advancedWhere
                    : and(
                          input.zeus.length > 0
                              ? inArray(
                                    attendances.zeusId,
                                    db
                                        .select({ id: troopers.id })
                                        .from(troopers)
                                        .where(inArray(troopers.id, input.zeus))
                                )
                              : undefined,
                          input.eventType.length > 0
                              ? inArray(
                                    attendances.eventType,
                                    input.eventType
                                )
                              : undefined,
                          input.coZeus.length > 0
                              ? arrayContains(
                                    attendances.coZeusIds,
                                    input.coZeus
                                )
                              : undefined,
                          fromDate
                              ? gte(
                                    attendances.eventDate,
                                    fromDate.toISOString()
                                )
                              : undefined,
                          toDate
                              ? lte(attendances.eventDate, toDate.toISOString())
                              : undefined
                      );

                const orderBy =
                    input.sort.length > 0
                        ? input.sort.map((item) =>
                              item.desc
                                  ? desc(attendances[item.id])
                                  : asc(attendances[item.id])
                          )
                        : [desc(attendances.eventDate)];

                const { data, total } = await db.transaction(async (tx) => {
                    const attendancesData = await tx
                        .select({
                            id: attendances.id,
                            zeusId: attendances.zeusId,
                            coZeusIds: attendances.coZeusIds,
                            eventType: attendances.eventType,
                            eventDate: attendances.eventDate,
                            eventNotes: attendances.eventNotes,
                        })
                        .from(attendances)
                        .leftJoin(troopers, eq(attendances.zeusId, troopers.id))
                        .limit(input.perPage)
                        .offset(offset)
                        .where(where)
                        .orderBy(...orderBy);

                    const data = await Promise.all(
                        attendancesData.map(async (attendance) => {
                            // Fetch Zeus directly from zeusId — works for all records
                            // regardless of whether Zeus is in trooperAttendances.
                            const zeusRows = attendance.zeusId
                                ? await tx
                                      .select({
                                          id: troopers.id,
                                          name: troopers.name,
                                          numbers: troopers.numbers,
                                          rank: troopers.rank,
                                      })
                                      .from(troopers)
                                      .where(eq(troopers.id, attendance.zeusId))
                                : [];
                            const zeus = zeusRows[0] ?? null;

                            // Fetch co-zeuses directly from coZeusIds array
                            const cozeus =
                                attendance.coZeusIds && attendance.coZeusIds.length > 0
                                    ? await tx
                                          .select({
                                              id: troopers.id,
                                              name: troopers.name,
                                              numbers: troopers.numbers,
                                              rank: troopers.rank,
                                          })
                                          .from(troopers)
                                          .where(inArray(troopers.id, attendance.coZeusIds))
                                    : [];

                            // Regular attendees — exclude zeus and co-zeus to avoid duplicates
                            const zeusAndCoZeusIds = new Set([
                                ...(attendance.zeusId ? [attendance.zeusId] : []),
                                ...(attendance.coZeusIds ?? []),
                            ]);
                            const attendees = await tx
                                .select({
                                    id: troopers.id,
                                    name: troopers.name,
                                    numbers: troopers.numbers,
                                    rank: troopers.rank,
                                })
                                .from(trooperAttendances)
                                .leftJoin(
                                    troopers,
                                    eq(trooperAttendances.trooperId, troopers.id)
                                )
                                .where(
                                    eq(trooperAttendances.attendanceId, attendance.id)
                                )
                                .then((rows) =>
                                    rows.filter((r) => r.id && !zeusAndCoZeusIds.has(r.id))
                                );

                            return {
                                id: attendance.id,
                                zeus,
                                cozeus,
                                eventType: attendance.eventType,
                                eventDate: attendance.eventDate,
                                eventNotes: attendance.eventNotes,
                                attendees,
                            } as OperationEntry;
                        })
                    );

                    const total = await tx
                        .select({
                            count: count(),
                        })
                        .from(attendances)
                        .where(where)
                        .execute()
                        .then((res) => res[0]?.count ?? 0);

                    return {
                        data,
                        total,
                    };
                });

                const pageCount = Math.ceil(total / input.perPage);
                return { data, pageCount, total };
            } catch (error) {
                console.error("Error fetching operations: ", error);
                return { data: [], pageCount: 0, total: 0 };
            }
        },
        [JSON.stringify(input)],
        {
            revalidate: 300,
            tags: ["operations"],
        }
    )();
}

//Unused for now
export async function getOperationTypeCounts(input: GetOperationsSchema) {
    return unstable_cache(
        async () => {
            try {
                const where = and(
                    input.zeus.length > 0
                        ? inArray(attendances.zeusId, input.zeus)
                        : undefined
                );

                return await db
                    .select({
                        eventType: attendances.eventType,
                        count: count(),
                    })
                    .from(attendances)
                    .where(where)
                    .groupBy(attendances.eventType)
                    .then((res) =>
                        res.reduce((acc, { eventType, count }) => {
                            acc[eventType] = count;
                            return acc;
                        }, {} as Record<string, number>)
                    );
            } catch (err) {
                return {} as Record<string, number>;
            }
        },
        ["operations-type-counts"],
        {
            revalidate: 300,
        }
    )();
}
