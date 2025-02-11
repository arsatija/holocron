import "server-only";

import { db } from "@/db";
import { trainings, troopers, qualifications } from "@/db/schema";
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
import { type GetTrainingsSchema } from "./validations";
import { getFullTrooperName } from "@/lib/utils";
import { TrainingEntry } from "@/lib/types";

export async function getTrainings(input: GetTrainingsSchema) {
    return await unstable_cache(
        async () => {
            try {
                const offset = (input.page - 1) * input.perPage;
                const fromDate = input.from ? new Date(input.from) : undefined;
                const toDate = input.to ? new Date(input.to) : undefined;
                const advancedTable = input.flags.includes("advancedTable");

                const advancedWhere = filterColumns({
                    table: trainings,
                    filters: input.filters,
                    joinOperator: input.joinOperator,
                });

                const where = advancedTable
                    ? advancedWhere
                    : and(
                          input.trainer.length > 0
                              ? inArray(
                                    trainings.trainerId,
                                    db
                                        .select({ id: troopers.id })
                                        .from(troopers)
                                        .where(
                                            inArray(troopers.id, input.trainer)
                                        )
                                )
                              : undefined,
                          input.qualification.length > 0
                              ? inArray(
                                    trainings.qualificationId,
                                    input.qualification
                                )
                              : undefined,
                          input.trainees.length > 0
                              ? inArray(
                                    trainings.traineeIds,
                                    db
                                        .select({ id: troopers.id })
                                        .from(troopers)
                                        .where(
                                            or(
                                                ...input.trainees.map((name) =>
                                                    ilike(
                                                        troopers.name,
                                                        `%${name}%`
                                                    )
                                                )
                                            )
                                        )
                                )
                              : undefined
                      );

                const orderBy =
                    input.sort.length > 0
                        ? input.sort.map((item) =>
                              item.desc
                                  ? desc(trainings[item.id])
                                  : asc(trainings[item.id])
                          )
                        : [desc(trainings.trainingDate)];

                const { data, total } = await db.transaction(async (tx) => {
                    const trainingsData = await tx
                        .select({
                            id: trainings.id,
                            trainerId: trainings.trainerId,
                            traineeIds: trainings.traineeIds,
                            qualificationId: trainings.qualificationId,
                            trainingDate: trainings.trainingDate,
                            trainingNotes: trainings.trainingNotes,
                        })
                        .from(trainings)
                        .leftJoin(
                            troopers,
                            eq(trainings.trainerId, troopers.id)
                        )
                        .leftJoin(
                            qualifications,
                            eq(trainings.qualificationId, qualifications.id)
                        )
                        .limit(input.perPage)
                        .offset(offset)
                        .where(where)
                        .orderBy(...orderBy);

                    const data = await Promise.all(
                        trainingsData.map(async (training) => {
                            const trainees = await tx
                                .select({
                                    name: troopers.name,
                                    numbers: troopers.numbers,
                                    rank: troopers.rank,
                                })
                                .from(troopers)
                                .where(
                                    inArray(
                                        troopers.id,
                                        training.traineeIds ?? []
                                    )
                                );

                            const trainer = await tx
                                .select({
                                    id: troopers.id,
                                    name: troopers.name,
                                    numbers: troopers.numbers,
                                    rank: troopers.rank,
                                })
                                .from(troopers)
                                .where(eq(troopers.id, training.trainerId))
                                .then((res) => res[0]);

                            const qualification = await tx
                                .select({
                                    id: qualifications.id,
                                    name: qualifications.name,
                                    abbreviation: qualifications.abbreviation,
                                })
                                .from(qualifications)
                                .where(
                                    eq(
                                        qualifications.id,
                                        training.qualificationId
                                    )
                                )
                                .then((res) => res[0]);

                            if (!qualification) {
                                throw new Error(
                                    `Qualification ${input.qualification} not found`
                                );
                            }

                            return {
                                id: training.id,
                                qualification: qualification,
                                trainingDate: training.trainingDate,
                                trainingNotes: training.trainingNotes,
                                trainees: trainees.map((t) =>
                                    getFullTrooperName({
                                        name: t.name,
                                        numbers: t.numbers,
                                        rank: t.rank,
                                    })
                                ),
                                trainer: trainer ?? null,
                            } as TrainingEntry;
                        })
                    );

                    const total = await tx
                        .select({
                            count: count(),
                        })
                        .from(trainings)
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
                console.error("Error fetching trainings: ", error);
                return { data: [], pageCount: 0, total: 0 };
            }
        },
        [JSON.stringify(input)],
        {
            revalidate: 300,
            tags: ["trainings"],
        }
    )();
}

//Unused for now
export async function getTrainingQualificationCounts(
    input: GetTrainingsSchema
) {
    return unstable_cache(
        async () => {
            try {
                const where = and(
                    input.trainer.length > 0
                        ? inArray(trainings.trainerId, input.trainer)
                        : undefined
                );

                return await db
                    .select({
                        qualificationId: trainings.qualificationId,
                        count: count(),
                    })
                    .from(trainings)
                    .where(where)
                    .groupBy(trainings.qualificationId)
                    .then((res) =>
                        res.reduce((acc, { qualificationId, count }) => {
                            acc[qualificationId] = count;
                            return acc;
                        }, {} as Record<string, number>)
                    );
            } catch (err) {
                return {} as Record<string, number>;
            }
        },
        ["trainings-qualification-counts"],
        {
            revalidate: 300,
        }
    )();
}
