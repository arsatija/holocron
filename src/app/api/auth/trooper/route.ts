import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getTrooper } from "@/services/troopers";
import { getTrooperByAccount } from "@/services/users";
import { getFullTrooperName } from "@/lib/utils";
import { getRank } from "@/services/ranks";
import {
    getTrooperDepartments,
    getTrooperPositionSlugs,
} from "@/services/departments";
import { getTrooperQualificationPermissions, getTrooperQualificationCategories } from "@/services/qualifications";
import { getTrooperBilletSlug } from "@/services/billets";
import {
    getBilletHierarchyChain,
    getPositionHierarchyChain,
} from "@/services/permissions";
import { evaluateAndAwardMedals } from "@/services/medal-criteria";

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session?.user?.name) {
            return NextResponse.json(null);
        }

        // Get user and associated trooper data
        const user = await getTrooperByAccount(session?.user?.name || "");
        if (user) {
            const trooper = await getTrooper(user.trooperId);
            if (!trooper) {
                return NextResponse.json(null);
            }

            evaluateAndAwardMedals(trooper.id).catch((err) =>
                console.error("Medal evaluation failed:", err),
            );

            const rankData = await getRank(trooper.rank);
            const trooperName = getFullTrooperName({ ...trooper, rankAbbr: rankData?.abbreviation ?? null });
            const trooperDepartments = await getTrooperDepartments(trooper.id);
            const trooperQualifications = await getTrooperQualificationPermissions(trooper.id);
            const trooperQualificationCategories = await getTrooperQualificationCategories(trooper.id);
            const billetSlug = await getTrooperBilletSlug(trooper.id);
            const positionSlugs = await getTrooperPositionSlugs(trooper.id);

            // Expand hierarchy chains to include all inherited permissions
            let billetPermissions: string[] = [];
            if (billetSlug) {
                billetPermissions = await getBilletHierarchyChain(billetSlug);
            }

            let positionPermissions: string[] = [];
            for (const slug of positionSlugs) {
                const chain = await getPositionHierarchyChain(slug);
                positionPermissions = [...positionPermissions, ...chain];
            }
            // Remove duplicates
            positionPermissions = [...new Set(positionPermissions)];

            const trooperCtx = {
                id: user.trooperId,
                fullName: trooperName,
                rankLevel: rankData?.rankLevel ?? "Enlisted",
                departments:
                    trooperDepartments.flatMap(
                        (department) => department.departmentScopes
                    ) ?? [],
                qualifications: trooperQualifications,
                qualificationCategories: trooperQualificationCategories,
                billetSlug: billetSlug,
                positionSlugs: positionSlugs,
                billetPermissions: billetPermissions,
                positionPermissions: positionPermissions,
            };
            return NextResponse.json(trooperCtx);
        }
        return NextResponse.json(null);
    } catch (error) {
        console.error("Error in trooper route:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
