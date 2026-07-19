"use server";

import { getServerSession } from "next-auth";
import { getTrooper } from "@/services/troopers";
import { getTrooperByAccount } from "@/services/users";
import { getFullTrooperName } from "@/lib/utils";
import { getRank } from "@/services/ranks";
import {
    getTrooperDepartments,
    getTrooperPositionSlugs,
} from "@/services/departments";
import {
    getTrooperQualificationPermissions,
    getTrooperQualificationCategories,
} from "@/services/qualifications";
import { getTrooperBilletSlug } from "@/services/billets";
import {
    getBilletHierarchyChain,
    getPositionHierarchyChain,
} from "@/services/permissions";
import type { UserTrooperInfo } from "@/lib/permissions";

// Builds the full permission context for a trooper. Shared by /api/auth/trooper
// (client-facing, cached in the trooperCtx cookie for UI gating) and getTrooperCtx
// below (server-side, session-derived, trusted for actual authorization checks).
export async function buildTrooperCtx(
    trooperId: string
): Promise<UserTrooperInfo | null> {
    const trooper = await getTrooper(trooperId);
    if (!trooper) return null;

    const rankData = await getRank(trooper.rank);
    const trooperName = getFullTrooperName({
        ...trooper,
        rankAbbr: rankData?.abbreviation ?? null,
    });
    const trooperDepartments = await getTrooperDepartments(trooper.id);
    const trooperQualifications = await getTrooperQualificationPermissions(
        trooper.id
    );
    const trooperQualificationCategories =
        await getTrooperQualificationCategories(trooper.id);
    const billetSlug = await getTrooperBilletSlug(trooper.id);
    const positionSlugs = await getTrooperPositionSlugs(trooper.id);

    let billetPermissions: string[] = [];
    if (billetSlug) {
        billetPermissions = await getBilletHierarchyChain(billetSlug);
    }

    let positionPermissions: string[] = [];
    for (const slug of positionSlugs) {
        const chain = await getPositionHierarchyChain(slug);
        positionPermissions = [...positionPermissions, ...chain];
    }
    positionPermissions = [...new Set(positionPermissions)];

    return {
        id: trooper.id,
        fullName: trooperName,
        rankLevel: rankData?.rankLevel ?? "Enlisted",
        departments:
            trooperDepartments.flatMap(
                (department) => department.departmentScopes
            ) ?? [],
        qualifications: trooperQualifications,
        qualificationCategories: trooperQualificationCategories,
        billetSlug,
        positionSlugs,
        billetPermissions,
        positionPermissions,
    };
}

// Session-derived ctx for server-side authorization — NOT sourced from the
// client-writable trooperCtx cookie. Use this (not the cookie) in any code path
// that enforces a permission check, e.g. all wiki server actions and restricted
// wiki reads. See plans/tech-debt.md #1.
export async function getTrooperCtx(): Promise<UserTrooperInfo | null> {
    const session = await getServerSession();
    if (!session?.user?.name) return null;

    const user = await getTrooperByAccount(session.user.name);
    if (!user) return null;

    return buildTrooperCtx(user.trooperId);
}
