"use server"
import * as React from "react"
import { type SearchParams } from "@/types"

import { getValidFilters } from "@/lib/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DateRangePicker } from "@/components/date-range-picker"
import { Shell } from "@/components/shell"

import { FeatureFlagsProvider } from "@/_components/feature-flags-provider"
import { PlayersTable } from "@/_components/players-table"
import {
  getPlayers,
  getPlayerStatusCounts,
} from "@/_lib/queries"
import { searchParamsCache } from "@/_lib/validations"

export default async function Table(props) {
  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const validFilters = getValidFilters(search.filters)

  const promises = Promise.all([
    getPlayers({
      ...search,
      filters: validFilters,
    }),
    getPlayerStatusCounts(),
  ])

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
              cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem", "8rem"]}
              shrinkZero
            />
          }
        >
          <PlayersTable promises={promises} />
        </React.Suspense>
      </FeatureFlagsProvider>
    </Shell>
  )
}
