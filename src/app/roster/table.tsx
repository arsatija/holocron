"use server";
import * as React from "react";
import { getServerSession } from "next-auth";

import { getValidFilters } from "@/lib/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DateRangePicker } from "@/components/date-range-picker";
import { Shell } from "@/components/shell";

import { FeatureFlagsProvider } from "../../contexts/feature-flags-provider";
import { PlayersTable } from "./_components/players-table";
import { getPlayers, getPlayerStatusCounts } from "@/app/roster/_lib/queries";
import { searchParamsCache } from "@/app/roster/_lib/validations";
import { getTrooperByAccount } from "@/services/users";
import { getTrooper } from "@/services/troopers";
import { getRank } from "@/services/ranks";

const JNCO_PLUS_RANKS = ["JNCO", "SNCO", "Company", "Command"] as const;

async function resolveCanViewDischarged(): Promise<boolean> {
    try {
        const session = await getServerSession();
        if (!session?.user?.name) return false;

        const user = await getTrooperByAccount(session.user.name);
        if (!user) return false;

        const trooper = await getTrooper(user.trooperId);
        if (!trooper) return false;

        const rankData = await getRank(trooper.rank);
        return JNCO_PLUS_RANKS.includes(rankData?.rankLevel as (typeof JNCO_PLUS_RANKS)[number]);
    } catch {
        return false;
    }
}

export default async function Table(props: any) {
    const searchParams = await props.searchParams;
    const search = searchParamsCache.parse(searchParams);

    const validFilters = getValidFilters(search.filters);
    const canViewDischarged = await resolveCanViewDischarged();

    const promises = Promise.all([
        getPlayers({
            ...search,
            filters: validFilters,
        }, canViewDischarged),
        getPlayerStatusCounts(canViewDischarged),
    ]);

    return (
        <Shell className="gap-2">
            <FeatureFlagsProvider>
                <React.Suspense fallback={<Skeleton className="h-7 w-52" />}>
                    <DateRangePicker
                        triggerSize="sm"
                        triggerClassName="ml-auto w-full sm:w-56 md:w-60"
                        align="end"
                        shallow={false}
                    />
                </React.Suspense>
                <React.Suspense
                    fallback={
                        <DataTableSkeleton
                            columnCount={6}
                            searchableColumnCount={1}
                            filterableColumnCount={2}
                            cellWidths={[
                                "10rem",
                                "40rem",
                                "12rem",
                                "12rem",
                                "8rem",
                                "8rem",
                            ]}
                            shrinkZero
                        />
                    }
                >
                    <PlayersTable promises={promises} canViewDischarged={canViewDischarged} />
                </React.Suspense>
            </FeatureFlagsProvider>
        </Shell>
    );
}
