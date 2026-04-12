import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { trainingCompletions, trainings, qualifications, troopers } from "@/db/schema";
import { and, eq, notExists, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const qualificationId = searchParams.get("qualificationId");

        const rows = await db
            .select({
                id: trainingCompletions.id,
                trainingDate: trainingCompletions.trainingDate,
                trainingNotes: trainingCompletions.trainingNotes,
                qualificationId: trainingCompletions.qualificationId,
                qualificationName: qualifications.name,
                qualificationAbbreviation: qualifications.abbreviation,
                trainerId: trainingCompletions.trainerId,
                trainerName: troopers.name,
                trainerNumbers: troopers.numbers,
                traineeCount: trainingCompletions.traineeIds,
            })
            .from(trainingCompletions)
            .leftJoin(qualifications, eq(trainingCompletions.qualificationId, qualifications.id))
            .leftJoin(troopers, eq(trainingCompletions.trainerId, troopers.id))
            .where(
                and(
                    notExists(
                        db.select({ id: trainings.id })
                            .from(trainings)
                            .where(eq(trainings.trainingCompletionId, trainingCompletions.id))
                    ),
                    qualificationId ? eq(trainingCompletions.qualificationId, qualificationId) : undefined,
                )
            )
            .orderBy(desc(trainingCompletions.trainingDate))
            .limit(15);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching unlinked training completions:", error);
        return NextResponse.json({ error: "Failed to fetch unlinked completions" }, { status: 500 });
    }
}
