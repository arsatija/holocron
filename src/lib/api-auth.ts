import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getTrooperByAccount } from "@/services/users";
import { getTrooper } from "@/services/troopers";
import { getRank } from "@/services/ranks";
import { getTrooperDepartments, getTrooperPositionSlugs } from "@/services/departments";
import { getTrooperQualificationPermissions, getTrooperQualificationCategories } from "@/services/qualifications";
import { getTrooperBilletSlug } from "@/services/billets";
import { getBilletHierarchyChain, getPositionHierarchyChain } from "@/services/permissions";
import { checkPermissionsSync } from "@/lib/permissions";
import type { RankLevel } from "@/db/schema";

async function resolveSessionCtx() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) return null;

    const user = await getTrooperByAccount(session.user.name);
    if (!user) return null;

    const trooper = await getTrooper(user.trooperId);
    if (!trooper) return null;

    const rankData = await getRank(trooper.rank);
    const departments = await getTrooperDepartments(trooper.id);
    const qualifications = await getTrooperQualificationPermissions(trooper.id);
    const qualificationCategories = await getTrooperQualificationCategories(trooper.id);
    const billetSlug = await getTrooperBilletSlug(trooper.id);
    const positionSlugs = await getTrooperPositionSlugs(trooper.id);

    let billetPermissions: string[] = [];
    if (billetSlug) billetPermissions = await getBilletHierarchyChain(billetSlug);

    let positionPermissions: string[] = [];
    for (const slug of positionSlugs) {
        positionPermissions = [...positionPermissions, ...(await getPositionHierarchyChain(slug))];
    }

    return {
        id: user.trooperId,
        fullName: "",
        rankLevel: (rankData?.rankLevel ?? "Enlisted") as RankLevel,
        departments: departments.flatMap((d) => d.departmentScopes) ?? [],
        qualifications,
        qualificationCategories,
        billetSlug,
        positionSlugs,
        billetPermissions,
        positionPermissions: [...new Set(positionPermissions)],
    };
}

export async function requirePermission(
    allowedPermissions: string[]
): Promise<NextResponse | null> {
    const ctx = await resolveSessionCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!checkPermissionsSync(ctx, allowedPermissions)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
}

export async function requirePermissionOrOwn(
    ownerId: string,
    allowedPermissions: string[]
): Promise<NextResponse | null> {
    const ctx = await resolveSessionCtx();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (ctx.id === ownerId) return null;
    if (!checkPermissionsSync(ctx, allowedPermissions)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
}
