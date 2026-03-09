"use server";

import * as React from "react";
import { Shell } from "@/components/shell";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DateRangePicker } from "@/components/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { searchParamsCache } from "./_lib/validations";
import { getAuditLogsForTable } from "./_lib/queries";
import { AuditTable } from "./_components/audit-table";
import { type SearchParams } from "@/types";

export default async function AuditTableContainer({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const search = searchParamsCache.parse(params);
    const promise = getAuditLogsForTable(search);

    return (
        <Shell className="gap-2">
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
                        cellWidths={[
                            "12rem",
                            "10rem",
                            "6rem",
                            "10rem",
                            "10rem",
                            "8rem",
                        ]}
                        shrinkZero
                    />
                }
            >
                <AuditTable promise={promise} />
            </React.Suspense>
        </Shell>
    );
}
