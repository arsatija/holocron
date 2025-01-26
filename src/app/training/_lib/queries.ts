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
    arrayContains
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
                          input.trainer
                              ? eq(
                                    trainings.trainerId,
                                    db
                                        .select({ id: troopers.id })
                                        .from(troopers)
                                        .where(
                                            ilike(
                                                troopers.name,
                                                `%${input.trainer}%`
                                            )
                                        )
                                )
                              : undefined,
                          input.qualificationAbbreviation
                              ? eq(
                                    trainings.qualificationId,
                                    db
                                        .select({ id: qualifications.id })
                                        .from(qualifications)
                                        .where(
                                            ilike(
                                                qualifications.abbreviation,
                                                `%${input.qualificationAbbreviation}%`
                                            )
                                        )
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
                              : undefined,
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
                                    name: troopers.name,
                                    numbers: troopers.numbers,
                                    rank: troopers.rank,
                                })
                                .from(troopers)
                                .where(eq(troopers.id, training.trainerId))
                                .then((res) => res[0]);

                            const qualificationAbbreviation = await tx
                                .select({
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

                            return {
                                id: training.id,
                                qualificationAbbreviation:
                                    qualificationAbbreviation.abbreviation,
                                trainingDate: training.trainingDate,
                                trainingNotes: training.trainingNotes,
                                trainees: trainees.map((t) =>
                                    getFullTrooperName({
                                        name: t.name,
                                        numbers: t.numbers,
                                        rank: t.rank,
                                    })
                                ),
                                trainer: trainer
                                    ? getFullTrooperName({
                                          name: trainer.name,
                                          numbers: trainer.numbers,
                                          rank: trainer.rank,
                                      })
                                    : "---",
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
                return { data, pageCount };
            } catch (error) {
                console.error("Error fetching trainings: ", error);
                return { data: [], pageCount: 0 };
            }
        },
        [JSON.stringify(input)],
        {
            revalidate: 300,
            tags: ["trainings"],
        }
    )();
}
