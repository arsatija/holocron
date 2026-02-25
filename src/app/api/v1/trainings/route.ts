import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { trainings, troopers, qualifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { TrainingEntry } from "@/lib/types";

export async function GET(request: NextRequest) {
    const qualificationId = request.nextUrl.searchParams.get("qualificationId");

    try {
        const trainingsData = await db.query.trainings.findMany({
            where: qualificationId
                ? eq(trainings.qualificationId, qualificationId)
                : undefined,
            columns: {
                id: true,
                trainerId: true,
                traineeIds: true,
                qualificationId: true,
                trainingDate: true,
                trainingNotes: true,
            },
            orderBy: (trainings, { desc }) => [desc(trainings.trainingDate)],
        });

        const results: TrainingEntry[] = await Promise.all(
            trainingsData.map(async (training) => {
                const [trainer, qualification, traineesResult] =
                    await Promise.all([
                        db
                            .select({
                                id: troopers.id,
                                name: troopers.name,
                                numbers: troopers.numbers,
                                rank: troopers.rank,
                            })
                            .from(troopers)
                            .where(eq(troopers.id, training.trainerId))
                            .then((res) => res[0] ?? null),

                        db
                            .select({
                                id: qualifications.id,
                                name: qualifications.name,
                                abbreviation: qualifications.abbreviation,
                            })
                            .from(qualifications)
                            .where(
                                eq(qualifications.id, training.qualificationId)
                            )
                            .then((res) => res[0]),

                        training.traineeIds && training.traineeIds.length > 0
                            ? db
                                  .select({
                                      id: troopers.id,
                                      name: troopers.name,
                                      numbers: troopers.numbers,
                                      rank: troopers.rank,
                                  })
                                  .from(troopers)
                                  .where(
                                      inArray(troopers.id, training.traineeIds)
                                  )
                            : Promise.resolve([]),
                    ]);

                return {
                    id: training.id,
                    qualification: qualification!,
                    trainingDate: training.trainingDate,
                    trainingNotes: training.trainingNotes ?? null,
                    trainer: trainer ?? null,
                    trainees: traineesResult,
                };
            })
        );

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching trainings:", error);
        return NextResponse.json(
            { error: "Failed to fetch trainings" },
            { status: 500 }
        );
    }
}
