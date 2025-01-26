"use client";

import * as React from "react";
import type {
    DataTableAdvancedFilterField,
    DataTableFilterField,
    DataTableRowAction,
} from "@/types";

import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import { getColumns } from "./trainings-table-columns";
import { TrainingsTableToolbarActions } from "./trainings-table-toolbar-actions";
import { useFeatureFlags } from "@/contexts/feature-flags-provider";
import { getTrainings } from "../_lib/queries";
import { TrainingEntry } from "@/lib/types";

interface TrainingsTableProps {
    promises: Promise<[Awaited<ReturnType<typeof getTrainings>>]>;
}

export function TrainingsTable({ promises }: TrainingsTableProps) {
    const { featureFlags } = useFeatureFlags();
    const [{ data, pageCount }] = React.use(promises);
    const [rowAction, setRowAction] =
        React.useState<DataTableRowAction<TrainingEntry> | null>(null);

    const columns = React.useMemo(
        () => getColumns({ setRowAction }),
        [setRowAction]
    );

    const filterFields: DataTableFilterField<TrainingEntry>[] = [
        {
            id: "qualificationAbbreviation",
            label: "Qualification",
            placeholder: "Filter by qualification...",
        },
        {
            id: "trainer",
            label: "Trainer",
            placeholder: "Filter by trainer...",
        },
    ];

    const advancedFilterFields: DataTableAdvancedFilterField<TrainingEntry>[] =
        [
            {
                id: "trainer",
                label: "Trainer",
                type: "text",
            },
            {
                id: "qualificationAbbreviation",
                label: "Qualification",
                type: "text",
            },
            {
                id: "trainingDate",

                label: "Training Date",
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
            sorting: [{ id: "trainingDate", desc: true }],
        },
        getRowId: (originalRow) => originalRow.id,
        shallow: false,
        clearOnDefault: true,
    });

    return (
        <DataTable table={table}>
            {enableAdvancedTable ? (
                <DataTableAdvancedToolbar
                    table={table}
                    filterFields={advancedFilterFields}
                >
                    <TrainingsTableToolbarActions table={table} />
                </DataTableAdvancedToolbar>
            ) : (
                <DataTableToolbar table={table} filterFields={filterFields}>
                    <TrainingsTableToolbarActions table={table} />
                </DataTableToolbar>
            )}
        </DataTable>
    );
}
