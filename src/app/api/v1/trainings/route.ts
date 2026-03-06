import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { trainingCompletions as trainings, troopers, qualifications } from "@/db/schema";
import { count, eq, inArray } from "drizzle-orm";
import { TrainingEntry } from "@/lib/types";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const qualificationId = searchParams.get("qualificationId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    try {
        const where = qualificationId
            ? eq(trainings.qualificationId, qualificationId)
            : undefined;

        const [trainingsData, totalResult] = await Promise.all([
            db.query.trainingCompletions.findMany({
                where,
                columns: {
                    id: true,
                    trainerId: true,
                    traineeIds: true,
                    qualificationId: true,
                    trainingDate: true,
                    trainingNotes: true,
                },
                orderBy: (trainings, { desc }) => [desc(trainings.trainingDate)],
                limit,
                offset,
            }),
            db.select({ count: count() }).from(trainings).where(where).then((r) => r[0]?.count ?? 0),
        ]);

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

        return NextResponse.json({
            data: results,
            total: totalResult,
            pageCount: Math.ceil(totalResult / limit),
            page,
            limit,
        });
    } catch (error) {
        console.error("Error fetching trainings:", error);
        return NextResponse.json(
            { error: "Failed to fetch trainings" },
            { status: 500 }
        );
    }
}
