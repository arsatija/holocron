import { NextResponse } from "next/server";
import { db } from "@/db";
import { troopers } from "@/db/schema";
import { count, eq, gte, sql, and, not, isNotNull, inArray } from "drizzle-orm";

export async function GET() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
        const startOfYear = new Date(now.getFullYear(), 0, 1)
            .toISOString()
            .split("T")[0];
        const twelveMonthsAgo = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            1,
        )
            .toISOString()
            .split("T")[0];

        const [
            totals,
            thisMonth,
            thisYear,
            byReferralMethod,
            recruiterCounts,
            referrerCounts,
            monthlyTrend,
        ] = await Promise.all([
            db
                .select({ status: troopers.status, count: count() })
                .from(troopers)
                .groupBy(troopers.status),

            db
                .select({ count: count() })
                .from(troopers)
                .where(
                    and(
                        gte(troopers.recruitmentDate, startOfMonth),
                        not(eq(troopers.status, "Discharged")),
                    ),
                ),

            db
                .select({ count: count() })
                .from(troopers)
                .where(
                    and(
                        gte(troopers.recruitmentDate, startOfYear),
                        not(eq(troopers.status, "Discharged")),
                    ),
                ),

            db
                .select({
                    method: troopers.referralMethod,
                    count: count(),
                })
                .from(troopers)
                .where(not(eq(troopers.status, "Discharged")))
                .groupBy(troopers.referralMethod),

            db
                .select({
                    recruitedBy: troopers.recruitedBy,
                    count: count(),
                })
                .from(troopers)
                .where(
                    and(
                        isNotNull(troopers.recruitedBy),
                        not(eq(troopers.status, "Discharged")),
                    ),
                )
                .groupBy(troopers.recruitedBy)
                .orderBy(sql`count(*) desc`)
                .limit(10),

            db
                .select({
                    referredBy: troopers.referredBy,
                    count: count(),
                })
                .from(troopers)
                .where(
                    and(
                        isNotNull(troopers.referredBy),
                        not(eq(troopers.status, "Discharged")),
                    ),
                )
                .groupBy(troopers.referredBy)
                .orderBy(sql`count(*) desc`)
                .limit(10),

            db
                .select({
                    month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${troopers.recruitmentDate}::timestamp), 'YYYY-MM')`,
                    count: count(),
                })
                .from(troopers)
                .where(gte(troopers.recruitmentDate, twelveMonthsAgo))
                .groupBy(
                    sql`DATE_TRUNC('month', ${troopers.recruitmentDate}::timestamp)`,
                )
                .orderBy(
                    sql`DATE_TRUNC('month', ${troopers.recruitmentDate}::timestamp)`,
                ),
        ]);

        // Resolve names for recruiter/referrer ID maps
        const allTrooperIds = [
            ...new Set([
                ...recruiterCounts.map((r) => r.recruitedBy).filter(Boolean) as string[],
                ...referrerCounts.map((r) => r.referredBy).filter(Boolean) as string[],
            ]),
        ];

        const trooperNameRows =
            allTrooperIds.length > 0
                ? await db
                      .select({
                          id: troopers.id,
                          name: troopers.name,
                          numbers: troopers.numbers,
                      })
                      .from(troopers)
                      .where(inArray(troopers.id, allTrooperIds))
                : [];

        const nameMap = Object.fromEntries(
            trooperNameRows.map((t) => [t.id, { name: t.name, numbers: t.numbers }]),
        );

        // Drill-down: who each top recruiter recruited
        const topRecruiterIds = recruiterCounts
            .map((r) => r.recruitedBy)
            .filter(Boolean) as string[];

        const recruiterDrilldown =
            topRecruiterIds.length > 0
                ? await db
                      .select({
                          recruitedBy: troopers.recruitedBy,
                          name: troopers.name,
                          numbers: troopers.numbers,
                      })
                      .from(troopers)
                      .where(
                          and(
                              inArray(troopers.recruitedBy, topRecruiterIds),
                              not(eq(troopers.status, "Discharged")),
                          ),
                      )
                      .orderBy(troopers.numbers)
                : [];

        const recruiterRecruitMap: Record<string, { name: string; numbers: number }[]> = {};
        for (const row of recruiterDrilldown) {
            if (!row.recruitedBy) continue;
            if (!recruiterRecruitMap[row.recruitedBy]) {
                recruiterRecruitMap[row.recruitedBy] = [];
            }
            recruiterRecruitMap[row.recruitedBy].push({ name: row.name, numbers: row.numbers });
        }

        // Drill-down: who each top referrer referred
        const topReferrerIds = referrerCounts
            .map((r) => r.referredBy)
            .filter(Boolean) as string[];

        const referrerDrilldown =
            topReferrerIds.length > 0
                ? await db
                      .select({
                          referredBy: troopers.referredBy,
                          name: troopers.name,
                          numbers: troopers.numbers,
                      })
                      .from(troopers)
                      .where(
                          and(
                              inArray(troopers.referredBy, topReferrerIds),
                              not(eq(troopers.status, "Discharged")),
                          ),
                      )
                      .orderBy(troopers.numbers)
                : [];

        const referrerReferredMap: Record<string, { name: string; numbers: number }[]> = {};
        for (const row of referrerDrilldown) {
            if (!row.referredBy) continue;
            if (!referrerReferredMap[row.referredBy]) {
                referrerReferredMap[row.referredBy] = [];
            }
            referrerReferredMap[row.referredBy].push({ name: row.name, numbers: row.numbers });
        }

        // Drill-down: who was recruited each month
        const monthlyDrilldown = await db
            .select({
                month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${troopers.recruitmentDate}::timestamp), 'YYYY-MM')`,
                name: troopers.name,
                numbers: troopers.numbers,
            })
            .from(troopers)
            .where(gte(troopers.recruitmentDate, twelveMonthsAgo))
            .orderBy(troopers.numbers);

        const monthlyRecruitMap: Record<string, { name: string; numbers: number }[]> = {};
        for (const row of monthlyDrilldown) {
            if (!monthlyRecruitMap[row.month]) {
                monthlyRecruitMap[row.month] = [];
            }
            monthlyRecruitMap[row.month].push({ name: row.name, numbers: row.numbers });
        }

        const activeCount = totals.find((t) => t.status === "Active")?.count ?? 0;
        const inactiveCount = totals.find((t) => t.status === "Inactive")?.count ?? 0;
        const dischargedCount = totals.find((t) => t.status === "Discharged")?.count ?? 0;
        const totalEver = activeCount + inactiveCount + dischargedCount;

        return NextResponse.json({
            summary: {
                totalActive: activeCount,
                totalInactive: inactiveCount,
                totalDischarged: dischargedCount,
                totalEver,
                thisMonth: thisMonth[0]?.count ?? 0,
                thisYear: thisYear[0]?.count ?? 0,
                retentionRate:
                    totalEver > 0
                        ? Math.round((activeCount / totalEver) * 100)
                        : 0,
            },
            referralMethods: byReferralMethod.map((r) => ({
                method: r.method ?? "unknown",
                count: r.count,
            })),
            topRecruiters: recruiterCounts
                .filter((r) => r.recruitedBy && nameMap[r.recruitedBy])
                .map((r) => ({
                    id: r.recruitedBy!,
                    name: nameMap[r.recruitedBy!].name,
                    numbers: nameMap[r.recruitedBy!].numbers,
                    count: r.count,
                    recruits: recruiterRecruitMap[r.recruitedBy!] ?? [],
                })),
            topReferrers: referrerCounts
                .filter((r) => r.referredBy && nameMap[r.referredBy])
                .map((r) => ({
                    id: r.referredBy!,
                    name: nameMap[r.referredBy!].name,
                    numbers: nameMap[r.referredBy!].numbers,
                    count: r.count,
                    referred: referrerReferredMap[r.referredBy!] ?? [],
                })),
            monthlyTrend: monthlyTrend.map((m) => ({
                month: m.month,
                count: m.count,
                recruits: monthlyRecruitMap[m.month] ?? [],
            })),
        });
    } catch (error) {
        console.error("Recruitment stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch recruitment stats" },
            { status: 500 },
        );
    }
}
