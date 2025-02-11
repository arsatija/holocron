"use server";

import { db } from "@/db";
import {
    departmentAssignments,
    departmentPositions,
    departments,
    NewTraining,
    trainings,
    trooperQualifications,
    troopers,
} from "@/db/schema";
import { getFullTrooperName } from "@/lib/utils";
import { and, arrayContains, asc, eq, inArray, not } from "drizzle-orm";
import { revalidateTag } from "next/cache";

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

export async function getTrainers() {
    const trainers = await db
        .select({
            id: troopers.id,
            name: troopers.name,
            rank: troopers.rank,
            numbers: troopers.numbers,
            status: troopers.status,
        })
        .from(departmentAssignments)
        .innerJoin(
            departmentPositions,
            eq(
                departmentAssignments.departmentPositionId,
                departmentPositions.id
            )
        )
        .innerJoin(
            departments,
            eq(departmentPositions.departmentId, departments.id)
        )
        .innerJoin(troopers, eq(departmentAssignments.trooperId, troopers.id))
        .where(
            and(
                arrayContains(departments.departmentScopes, ["Training"]),
                not(eq(troopers.status, "Discharged"))
            )
        )
        .groupBy(troopers.id) // Group by trooper ID to eliminate duplicates
        .orderBy(asc(troopers.rank));

    return trainers;
}

export async function getTrainersAsOptions() {
    const trainers = await getTrainers();
    return trainers.map((trainer) => ({
        label: getFullTrooperName(trainer),
        value: trainer.id,
    }));
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

export async function deleteTrainingCompletion(trainingCompletionId: string) {
    try {
        await db.transaction(async (tx) => {
            // get training completion entry of the training requested to be deleted
            const trainingEntries = await tx
                .select({
                    traineeIds: trainings.traineeIds,
                    qualificationId: trainings.qualificationId,
                })
                .from(trainings)
                .where(eq(trainings.id, trainingCompletionId));

            const { traineeIds, qualificationId } = trainingEntries[0];

            if (!qualificationId) {
                throw new Error("Qualification for training not found");
            }
            if (!traineeIds) {
                throw new Error("Trainee IDs for training not found");
            }

            // remove qualifications from trainees of this training
            await tx
                .delete(trooperQualifications)
                .where(
                    and(
                        eq(
                            trooperQualifications.qualificationId,
                            qualificationId
                        ),
                        inArray(trooperQualifications.trooperId, traineeIds)
                    )
                );

            // delete training completion entry
            await tx
                .delete(trainings)
                .where(eq(trainings.id, trainingCompletionId));
        });

        revalidateTag("trainings");
        revalidateTag("trooperQualifications");
        revalidateTag("troopers");
        revalidateTag("qualifications");

        return { success: true };
    } catch (error) {
        console.error("Failed to delete training completion:", error);
        return {
            error: `Failed to delete training completion: ${trainingCompletionId}`,
        };
    }
}
