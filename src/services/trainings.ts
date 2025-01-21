"use server";

import { db } from "@/db";
import { NewTraining, trainings, trooperQualifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getTrainings() {
    const trainings = await db.query.trainings.findMany();
    return trainings;
}

export async function getTrooperTrainings(trooperId: string) {
    const trainingsRan = await db.query.trainings.findMany({
        where: eq(trainings.trainerId, trooperId),
    });
    return trainingsRan;
}

export async function createTraining(newTraining: NewTraining) {
    const qualification = newTraining.qualificationId;
    const trainees = newTraining.traineeIds ?? [];

    const trainingId = await db.transaction(async (tx) => {
        const trainingResponse = await tx
            .insert(trainings)
            .values(newTraining)
            .returning();

        const trooperTraining = await tx.insert(trooperQualifications).values(
            trainees.map((trainee) => ({
                qualificationId: qualification,
                trooperId: trainee,
                earnedDate: trainingResponse[0].trainingDate,
            }))
        );

        return trainingResponse[0].id;
    });

    return trainingId;
}
