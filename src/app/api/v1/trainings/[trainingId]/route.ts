import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { trainings, troopers, qualifications } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { TrainingEntry } from "@/lib/types";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trainingId: string }> }
) {
    const { trainingId } = await params;

    try {
        const training = await db.query.trainings.findFirst({
            where: eq(trainings.id, trainingId),
        });

        if (!training) {
            return NextResponse.json(
                { error: "Training not found" },
                { status: 404 }
            );
        }

        const [trainer, qualification, traineesData] = await Promise.all([
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
                .where(eq(qualifications.id, training.qualificationId))
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
                      .where(inArray(troopers.id, training.traineeIds))
                : Promise.resolve([]),
        ]);

        if (!qualification) {
            return NextResponse.json(
                { error: "Qualification not found" },
                { status: 404 }
            );
        }

        const result: TrainingEntry = {
            id: training.id,
            qualification,
            trainingDate: training.trainingDate,
            trainingNotes: training.trainingNotes ?? null,
            trainer: trainer ?? null,
            trainees: traineesData,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching training:", error);
        return NextResponse.json(
            { error: "Failed to fetch training" },
            { status: 500 }
        );
    }
}
