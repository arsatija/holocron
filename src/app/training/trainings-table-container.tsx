"use server";
import * as React from "react";

import { getValidFilters } from "@/lib/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DateRangePicker } from "@/components/date-range-picker";
import { Shell } from "@/components/shell";

import { FeatureFlagsProvider } from "../../contexts/feature-flags-provider";
import { TrainingsTable } from "./_components/trainings-table";
import { getTrainings } from "@/app/training/_lib/queries";
import { getTroopersAsOptions } from "@/services/troopers";
import { searchParamsCache } from "@/app/training/_lib/validations";
import { getQualificationOptions } from "@/services/qualifications";

export default async function TrainingsTableContainer(props: any) {
    const searchParams = await props.searchParams;
    const search = searchParamsCache.parse(searchParams);

    const validFilters = getValidFilters(search.filters);

    const promises = Promise.all([
        getTrainings({
            ...search,
            filters: validFilters,
        }),
        getQualificationOptions(),
        getTroopersAsOptions(),
    ]);

    return (
        <Shell className="gap-2">
            <FeatureFlagsProvider>
                <React.Suspense fallback={<Skeleton className="h-7 w-52" />}>
                    <DateRangePicker
                        triggerSize="sm"
                        triggerClassName="ml-auto w-56 sm:w-60"
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
                    <TrainingsTable promises={promises} />
                </React.Suspense>
            </FeatureFlagsProvider>
        </Shell>
    );
}
