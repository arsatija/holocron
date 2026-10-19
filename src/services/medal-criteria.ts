"use server";

import { db } from "@/db";
import {
    medals,
    medalCriteria,
    trooperMedals,
    troopers,
    trooperQualifications,
    trainingCompletions,
    attendances,
} from "@/db/schema";
import { eq, and, arrayContains, not } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "./audit";
import { awardMedal } from "./medals";
import { getAttendanceCountForTrooper } from "./attendances";

export type MedalCriteriaType =
    | "Qualification"
    | "ZeusCount"
    | "ReferralCount"
    | "TrainingCompletionCount"
    | "AttendanceCount"
    | "TenureDays"
    | "HasMedal";

export type ZeusRole = "Zeus" | "CoZeus" | "Either";

export type MedalCriteriaInput = {
    criteriaType: MedalCriteriaType;
    qualificationId?: string | null;
    requiredMedalId?: string | null;
    threshold?: number | null;
    zeusRole?: ZeusRole | null;
    eventType?: "Main" | "Skirmish" | "Fun" | "Raid" | "Joint" | "Training" | null;
    ruleGroup?: number;
};

type MedalCriteriaRow = typeof medalCriteria.$inferSelect;

export type EvaluateMedalsOptions = {
    /** Only consider medals with at least one criterion of these types. Omit to consider all types. */
    relevantTypes?: MedalCriteriaType[];
    /** Further narrows HasMedal criteria to ones that require this specific medal. */
    requiredMedalId?: string;
    /** Whether awarding a medal here should trigger a follow-up HasMedal check. Internal — used to cap cascades at one level. */
    cascade?: boolean;
};

function criterionMatchesTrigger(
    criterion: MedalCriteriaRow,
    relevantTypes?: MedalCriteriaType[],
    requiredMedalId?: string,
): boolean {
    if (relevantTypes && !relevantTypes.includes(criterion.criteriaType)) return false;
    if (criterion.criteriaType === "HasMedal" && requiredMedalId) {
        return criterion.requiredMedalId === requiredMedalId;
    }
    return true;
}

export async function getCriteriaForMedal(medalId: string) {
    return db.query.medalCriteria.findMany({
        where: eq(medalCriteria.medalId, medalId),
        with: { qualification: true, requiredMedal: true },
    });
}

export async function addMedalCriteria(medalId: string, input: MedalCriteriaInput) {
    const [row] = await db
        .insert(medalCriteria)
        .values({ medalId, ...input })
        .returning();
    revalidateTag("medal-criteria");
    return row;
}

export async function deleteMedalCriteria(id: string) {
    await db.delete(medalCriteria).where(eq(medalCriteria.id, id));
    revalidateTag("medal-criteria");
}

export async function setMedalAutoAward(medalId: string, enabled: boolean) {
    await db.update(medals).set({ autoAwardEnabled: enabled }).where(eq(medals.id, medalId));
    revalidateTag("medals");
}

async function checkCriterion(trooperId: string, criterion: MedalCriteriaRow): Promise<boolean> {
    switch (criterion.criteriaType) {
        case "Qualification": {
            if (!criterion.qualificationId) return false;
            const existing = await db.query.trooperQualifications.findFirst({
                where: and(
                    eq(trooperQualifications.trooperId, trooperId),
                    eq(trooperQualifications.qualificationId, criterion.qualificationId),
                ),
            });
            return !!existing;
        }
        case "ZeusCount": {
            const threshold = criterion.threshold ?? 0;
            const role = criterion.zeusRole ?? "Either";
            const eventType = criterion.eventType;

            let zeusRows: { id: string }[] = [];
            let coZeusRows: { id: string }[] = [];

            if (role === "Zeus" || role === "Either") {
                zeusRows = await db.query.attendances.findMany({
                    where: eventType
                        ? and(
                              eq(attendances.zeusId, trooperId),
                              eq(attendances.eventType, eventType as (typeof attendances.eventType.enumValues)[number]),
                          )
                        : eq(attendances.zeusId, trooperId),
                    columns: { id: true },
                });
            }
            if (role === "CoZeus" || role === "Either") {
                coZeusRows = await db.query.attendances.findMany({
                    where: eventType
                        ? and(
                              arrayContains(attendances.coZeusIds, [trooperId]),
                              eq(attendances.eventType, eventType as (typeof attendances.eventType.enumValues)[number]),
                          )
                        : arrayContains(attendances.coZeusIds, [trooperId]),
                    columns: { id: true },
                });
            }
            const uniqueIds = new Set([...zeusRows, ...coZeusRows].map((a) => a.id));
            return uniqueIds.size >= threshold;
        }
        case "ReferralCount": {
            const threshold = criterion.threshold ?? 0;
            const referrals = await db.query.troopers.findMany({
                where: eq(troopers.referredBy, trooperId),
                columns: { id: true },
            });
            return referrals.length >= threshold;
        }
        case "TrainingCompletionCount": {
            const threshold = criterion.threshold ?? 0;
            const completions = await db.query.trainingCompletions.findMany({
                where: eq(trainingCompletions.trainerId, trooperId),
                columns: { id: true },
            });
            return completions.length >= threshold;
        }
        case "AttendanceCount": {
            const threshold = criterion.threshold ?? 0;
            const attendanceCount = await getAttendanceCountForTrooper(trooperId);
            return attendanceCount >= threshold;
        }
        case "TenureDays": {
            const threshold = criterion.threshold ?? 0;
            const trooper = await db.query.troopers.findFirst({
                where: eq(troopers.id, trooperId),
                columns: { recruitmentDate: true },
            });
            if (!trooper?.recruitmentDate) return false;
            const days = Math.floor(
                (Date.now() - new Date(trooper.recruitmentDate).getTime()) / (1000 * 60 * 60 * 24),
            );
            return days >= threshold;
        }
        case "HasMedal": {
            if (!criterion.requiredMedalId) return false;
            const existing = await db.query.trooperMedals.findFirst({
                where: and(
                    eq(trooperMedals.trooperId, trooperId),
                    eq(trooperMedals.medalId, criterion.requiredMedalId),
                ),
            });
            return !!existing;
        }
        default:
            return false;
    }
}

/**
 * Checks auto-award-enabled medals against a trooper's current data, and awards
 * any medal whose criteria are met. Rules sharing the same `ruleGroup` on a medal
 * are ANDed together; a medal is earned if ANY one group is fully satisfied (OR
 * between groups).
 *
 * Pass `relevantTypes` so callers only pay for the criteria checks their trigger
 * could actually have affected (e.g. an attendance submission only needs to
 * re-check AttendanceCount/ZeusCount medals, not every criteria type) — medals
 * with no criterion of a relevant type are skipped entirely before any per-
 * criterion queries run. Omit it only for full sweeps (e.g. the tenure cron).
 *
 * Safe to call often — it's a no-op if nothing new is earned.
 */
export async function evaluateAndAwardMedals(
    trooperId: string,
    options: EvaluateMedalsOptions = {},
) {
    const { relevantTypes, requiredMedalId, cascade = true } = options;
    try {
        const eligibleMedals = await db.query.medals.findMany({
            where: eq(medals.autoAwardEnabled, true),
            with: { medalCriteria: true },
        });

        const candidateMedals = eligibleMedals.filter((medal) =>
            medal.medalCriteria.some((c) =>
                criterionMatchesTrigger(c, relevantTypes, requiredMedalId),
            ),
        );
        if (candidateMedals.length === 0) return [];

        const alreadyHeld = await db.query.trooperMedals.findMany({
            where: eq(trooperMedals.trooperId, trooperId),
            columns: { medalId: true },
        });
        const heldIds = new Set(alreadyHeld.map((m) => m.medalId));

        const awarded: string[] = [];

        for (const medal of candidateMedals) {
            if (heldIds.has(medal.id)) continue;
            if (medal.medalCriteria.length === 0) continue;

            const groups = new Map<number, MedalCriteriaRow[]>();
            for (const criterion of medal.medalCriteria) {
                const group = groups.get(criterion.ruleGroup) ?? [];
                group.push(criterion);
                groups.set(criterion.ruleGroup, group);
            }

            let anyGroupMet = false;
            for (const groupCriteria of groups.values()) {
                const results = await Promise.all(
                    groupCriteria.map((c) => checkCriterion(trooperId, c)),
                );
                if (results.every(Boolean)) {
                    anyGroupMet = true;
                    break;
                }
            }

            if (anyGroupMet) {
                const row = await awardMedal(trooperId, medal.id);
                if (!row) continue; // already awarded by a concurrent evaluation

                await createAuditLog({
                    actorId: null,
                    action: "CREATE",
                    entityType: "trooper_medal",
                    entityId: medal.id,
                    entityLabel: `${medal.name} (auto-awarded)`,
                    targetTrooperId: trooperId,
                    newData: { trooperId, medalId: medal.id, auto: true },
                });
                awarded.push(medal.id);

                if (cascade) {
                    await evaluateAndAwardMedals(trooperId, {
                        relevantTypes: ["HasMedal"],
                        requiredMedalId: medal.id,
                        cascade: false,
                    });
                }
            }
        }

        return awarded;
    } catch (error) {
        console.error("Failed to evaluate medal criteria:", error);
        return [];
    }
}

/**
 * Nightly sweep for TenureDays-based medals — the one criteria type that can
 * become true purely from time passing, with no other trigger to hang it off of.
 * Intended to run once a day via a scheduled job, not on request paths.
 */
export async function runTenureMedalSweep() {
    const eligibleMedals = await db.query.medals.findMany({
        where: eq(medals.autoAwardEnabled, true),
        with: { medalCriteria: true },
    });
    const hasTenureCriteria = eligibleMedals.some((medal) =>
        medal.medalCriteria.some((c) => c.criteriaType === "TenureDays"),
    );
    if (!hasTenureCriteria) {
        return { troopersChecked: 0, medalsAwarded: 0 };
    }

    const activeTroopers = await db.query.troopers.findMany({
        where: not(eq(troopers.status, "Discharged")),
        columns: { id: true },
    });

    let medalsAwarded = 0;
    for (const trooper of activeTroopers) {
        const awarded = await evaluateAndAwardMedals(trooper.id, {
            relevantTypes: ["TenureDays"],
        });
        medalsAwarded += awarded.length;
    }

    return { troopersChecked: activeTroopers.length, medalsAwarded };
}