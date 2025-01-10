"use client";

import * as React from "react";
import { troopers, type Trooper } from "@/db/schema";
import type {
    DataTableAdvancedFilterField,
    DataTableFilterField,
    DataTableRowAction,
} from "@/types";

import { toSentenceCase } from "@/lib/utils";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import type { getPlayers, getPlayerStatusCounts } from "../_lib/queries";
import { useFeatureFlags } from "./feature-flags-provider";
import { getColumns } from "./players-table-columns";
import { PlayersTableToolbarActions } from "./players-table-toolbar-actions";

interface PlayersTableProps {
    promises: Promise<
        [
            Awaited<ReturnType<typeof getPlayers>>,
            Awaited<ReturnType<typeof getPlayerStatusCounts>>
        ]
    >;
}

export function PlayersTable({ promises }: PlayersTableProps) {
    const { featureFlags } = useFeatureFlags();

    const [{ data, pageCount }, statusCounts] = React.use(promises);

    const [rowAction, setRowAction] =
        React.useState<DataTableRowAction<Trooper> | null>(null);

    const columns = React.useMemo(
        () => getColumns({ setRowAction }),
        [setRowAction]
    );

    /**
     * This component can render either a faceted filter or a search filter based on the `options` prop.
     *
     * @prop options - An array of objects, each representing a filter option. If provided, a faceted filter is rendered. If not, a search filter is rendered.
     *
     * Each `option` object has the following properties:
     * @prop {string} label - The label for the filter option.
     * @prop {string} value - The value for the filter option.
     * @prop {React.ReactNode} [icon] - An optional icon to display next to the label.
     * @prop {boolean} [withCount] - An optional boolean to display the count of the filter option.
     */
    const filterFields: DataTableFilterField<Trooper>[] = [
        {
            id: "name",
            label: "Name",
            placeholder: "Filter names...",
        },
        {
            id: "status",
            label: "Status",
            options: troopers.status.enumValues.map((status) => ({
                label: toSentenceCase(status),
                value: status,
                count: statusCounts[status],
            })),
        },
    ];

    /**
     * Advanced filter fields for the data table.
     * These fields provide more complex filtering options compared to the regular filterFields.
     *
     * Key differences from regular filterFields:
     * 1. More field types: Includes 'text', 'multi-select', 'date', and 'boolean'.
     * 2. Enhanced flexibility: Allows for more precise and varied filtering options.
     * 3. Used with DataTableAdvancedToolbar: Enables a more sophisticated filtering UI.
     * 4. Date and boolean types: Adds support for filtering by date ranges and boolean values.
     */
    const advancedFilterFields: DataTableAdvancedFilterField<Trooper>[] = [
        {
            id: "name",
            label: "Name",
            type: "text",
        },
        {
            id: "status",
            label: "Status",
            type: "multi-select",
            options: troopers.status.enumValues.map((status) => ({
                label: toSentenceCase(status),
                value: status,
                count: statusCounts[status],
            })),
        },
        {
            id: "numbers",
            label: "Numbers",
            type: "number",
        },
        {
            id: "recruitmentDate",
            label: "Recruitment Date",
            type: "date",
        },
    ];

    const enableAdvancedTable = featureFlags.includes("advancedTable");

    const { table } = useDataTable({
        data,
        columns,
        pageCount,
        filterFields,
        enableAdvancedFilter: enableAdvancedTable,
        initialState: {
            sorting: [{ id: "rank", desc: false }],
        },
        getRowId: (originalRow) => originalRow.id,
        shallow: false,
        clearOnDefault: true,
    });

    return (
        <>
            <DataTable table={table}>
                {enableAdvancedTable ? (
                    <DataTableAdvancedToolbar
                        table={table}
                        filterFields={advancedFilterFields}
                        shallow={false}
                    >
                        <PlayersTableToolbarActions table={table} />
                    </DataTableAdvancedToolbar>
                ) : (
                    <DataTableToolbar table={table} filterFields={filterFields}>
                        <PlayersTableToolbarActions table={table} />
                    </DataTableToolbar>
                )}
            </DataTable>
        </>
    );
}
