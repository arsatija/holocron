"use server";

import { db } from "@/db";
import {
    departmentAssignments,
    departmentPositions,
    departments,
    NewPlayerQualification,
    NewTrainingCompletion,
    qualifications,
    ranks,
    trainingCompletions,
    trooperQualifications,
    troopers,
} from "@/db/schema";
import { TrainingEntry } from "@/lib/types";
import { findDifference, getFullTrooperName } from "@/lib/utils";
import { and, arrayContains, asc, eq, inArray, not } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";

export async function getTrainingCompletions() {
    const completions = await db.query.trainingCompletions.findMany();
    return completions;
}

export async function getTrooperTrainingCompletions(trooperId: string) {
    const completionsRan = await db.query.trainingCompletions.findMany({
        where: eq(trainingCompletions.trainerId, trooperId),
    });
    return completionsRan;
}

export async function getTrainers() {
    const trainers = await db
        .select({
            id: troopers.id,
            name: troopers.name,
            numbers: troopers.numbers,
            status: troopers.status,
            rankAbbr: ranks.abbreviation,
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
        .leftJoin(ranks, eq(troopers.rank, ranks.id))
        .where(
            and(
                arrayContains(departments.departmentScopes, ["Training"]),
                not(eq(troopers.status, "Discharged"))
            )
        )
        .groupBy(troopers.id, ranks.order)
        .orderBy(asc(ranks.order));

    return trainers;
}

export async function getTrainersAsOptions() {
    const trainers = await getTrainers();
    return trainers.map((trainer) => ({
        label: getFullTrooperName(trainer),
        value: trainer.id,
    }));
}

export async function createTrainingCompletion(newCompletion: NewTrainingCompletion, actorId?: string) {
    const qualification = newCompletion.qualificationId;
    const trainees = newCompletion.traineeIds ?? [];

    const completionId = await db.transaction(async (tx) => {
        const completionResponse = await tx
            .insert(trainingCompletions)
            .values(newCompletion)
            .returning();

        await tx.insert(trooperQualifications).values(
            trainees.map((trainee) => ({
                qualificationId: qualification,
                trooperId: trainee,
                earnedDate: completionResponse[0].trainingDate,
            }))
        );

        revalidateTag("training-completions");
        revalidateTag("trooperQualifications");

        return completionResponse[0].id;
    });

    const qual = newCompletion.qualificationId
        ? await db.query.qualifications.findFirst({
              where: eq(qualifications.id, newCompletion.qualificationId),
              columns: { name: true, abbreviation: true },
          })
        : null;
    await createAuditLog({
        actorId,
        action: "CREATE",
        entityType: "training_completion",
        entityId: completionId,
        entityLabel: qual ? `${qual.abbreviation} — ${qual.name}` : undefined,
        newData: newCompletion as unknown as Record<string, unknown>,
    });

    return completionId;
}

export async function deleteTrainingCompletion(trainingCompletionId: string, actorId?: string) {
    try {
        const previous = await db.query.trainingCompletions.findFirst({
            where: eq(trainingCompletions.id, trainingCompletionId),
        });

        await db.transaction(async (tx) => {
            const completionEntries = await tx
                .select({
                    traineeIds: trainingCompletions.traineeIds,
                    qualificationId: trainingCompletions.qualificationId,
                })
                .from(trainingCompletions)
                .where(eq(trainingCompletions.id, trainingCompletionId));

            const { traineeIds, qualificationId } = completionEntries[0];

            if (!qualificationId) {
                throw new Error("Qualification for training not found");
            }
            if (!traineeIds) {
                throw new Error("Trainee IDs for training not found");
            }

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

            await tx
                .delete(trainingCompletions)
                .where(eq(trainingCompletions.id, trainingCompletionId));
        });

        revalidateTag("training-completions");
        revalidateTag("trooperQualifications");

        const qual = previous?.qualificationId
            ? await db.query.qualifications.findFirst({
                  where: eq(qualifications.id, previous.qualificationId),
                  columns: { name: true, abbreviation: true },
              })
            : null;
        await createAuditLog({
            actorId,
            action: "DELETE",
            entityType: "training_completion",
            entityId: trainingCompletionId,
            entityLabel: qual ? `${qual.abbreviation} — ${qual.name}` : undefined,
            previousData: previous as unknown as Record<string, unknown>,
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to delete training completion:", error);
        return {
            error: `Failed to delete training completion: ${trainingCompletionId}`,
        };
    }
}

export async function updateTrainingCompletion(
    trainingCompletionId: string,
    updatedCompletion: NewTrainingCompletion,
    actorId?: string
) {
    try {
        const updatedTraineeIds = updatedCompletion.traineeIds ?? [];
        await db.transaction(async (tx) => {
            const oldEntry = await tx.query.trainingCompletions.findFirst({
                where: eq(trainingCompletions.id, trainingCompletionId),
            });

            if (!oldEntry) {
                throw new Error("Training completion entry not found");
            }

            const addedTrainees = findDifference(
                updatedTraineeIds,
                oldEntry.traineeIds
            );
            const removedTrainees = findDifference(
                oldEntry.traineeIds,
                updatedTraineeIds
            );

            const traineesToAddQualification = addedTrainees.map(
                (trainee) =>
                    ({
                        trooperId: trainee,
                        qualificationId: oldEntry.qualificationId,
                        earnedDate: oldEntry.trainingDate,
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
                                updatedCompletion.qualificationId
                            ),
                            inArray(
                                trooperQualifications.trooperId,
                                removedTrainees
                            )
                        )
                    );
            }

            await tx
                .update(trainingCompletions)
                .set(updatedCompletion)
                .where(eq(trainingCompletions.id, trainingCompletionId));
        });

        revalidateTag("training-completions");
        revalidateTag("trooperQualifications");

        const qual = updatedCompletion.qualificationId
            ? await db.query.qualifications.findFirst({
                  where: eq(qualifications.id, updatedCompletion.qualificationId),
                  columns: { name: true, abbreviation: true },
              })
            : null;
        await createAuditLog({
            actorId,
            action: "UPDATE",
            entityType: "training_completion",
            entityId: trainingCompletionId,
            entityLabel: qual ? `${qual.abbreviation} — ${qual.name}` : undefined,
            newData: updatedCompletion as unknown as Record<string, unknown>,
        });

        return { success: true };
    } catch (error) {
        console.error(
            `Database update for training completion ${trainingCompletionId} failed with error: ${error}`
        );
        return { error };
    }
}
