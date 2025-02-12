"use server";

import { db } from "@/db";
import {
    departmentAssignments,
    departmentPositions,
    departments,
    NewPlayerQualification,
    NewTraining,
    trainings,
    trooperQualifications,
    troopers,
} from "@/db/schema";
import { TrainingEntry } from "@/lib/types";
import { findDifference, getFullTrooperName } from "@/lib/utils";
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

        revalidateTag("trainings");
        revalidateTag("trooperQualifications");

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

        return { success: true };
    } catch (error) {
        console.error("Failed to delete training completion:", error);
        return {
            error: `Failed to delete training completion: ${trainingCompletionId}`,
        };
    }
}

export async function updateTraining(
    trainingId: string,
    updatedTraining: NewTraining
) {
    try {
        const updatedTraineeIds = updatedTraining.traineeIds ?? [];
        await db.transaction(async (tx) => {
            // Get old training entry for trainingId
            const oldTrainingEntry = await tx.query.trainings.findFirst({
                where: eq(trainings.id, trainingId),
            });

            if (!oldTrainingEntry) {
                throw new Error("Training entry not found");
            }

            const addedTrainees = findDifference(
                updatedTraineeIds,
                oldTrainingEntry.traineeIds
            );
            const removedTrainees = findDifference(
                oldTrainingEntry.traineeIds,
                updatedTraineeIds
            );

            const traineesToAddQualification = addedTrainees.map(
                (trainee) =>
                    ({
                        trooperId: trainee,
                        qualificationId: oldTrainingEntry.qualificationId,
                        earnedDate: oldTrainingEntry.trainingDate,
                    } as NewPlayerQualification)
            );

            if (traineesToAddQualification.length > 0) {
                await tx
                    .insert(trooperQualifications)
                    .values(traineesToAddQualification);
            }

            if (removedTrainees.length > 0) {
                await tx
                    .delete(trooperQualifications)
                    .where(
                        and(
                            eq(
                                trooperQualifications.qualificationId,
                                updatedTraining.qualificationId
                            ),
                            inArray(
                                trooperQualifications.trooperId,
                                removedTrainees
                            )
                        )
                    );
            }

            // Update training entry for trainingId
            await tx
                .update(trainings)
                .set(updatedTraining)
                .where(eq(trainings.id, trainingId));
        });

        revalidateTag("trainings");
        revalidateTag("trooperQualifications");

        return { success: true };
    } catch (error) {
        console.error(
            `Database update for training ${trainingId} failed with error: ${error}`
        );
        return {
            error: error,
        };
    }
}
