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

import { getColumns } from "./operations-table-columns";
import { OperationsTableToolbarActions } from "./operations-table-toolbar-actions";
import { useFeatureFlags } from "@/contexts/feature-flags-provider";
import { getOperations } from "../_lib/queries";
import { getTroopersAsOptions } from "@/services/troopers";
import { OperationEntry } from "@/lib/types";
import EditOperationDialog from "./edit-operation";
import DeleteOperationDialog from "./delete-operation";
import { selectEventTypesSchema } from "@/db/schema";
interface OperationsTableProps {
    promises: Promise<
        [
            Awaited<ReturnType<typeof getOperations>>,
            Awaited<ReturnType<typeof getTroopersAsOptions>>
        ]
    >;
}

export function OperationsTable({ promises }: OperationsTableProps) {
    const { featureFlags } = useFeatureFlags();
    const [{ data, pageCount, total }, troopers] = React.use(promises);
    const [rowAction, setRowAction] =
        React.useState<DataTableRowAction<OperationEntry> | null>(null);

    const columns = React.useMemo(
        () => getColumns({ setRowAction }),
        [setRowAction]
    );

    const filterFields: DataTableFilterField<OperationEntry>[] = [
        {
            id: "eventType",
            label: "Operation Type",
            options: selectEventTypesSchema.options.map((eventType) => ({
                label: eventType,
                value: eventType,
            })),
        },
        {
            id: "zeus",
            label: "Zeus",
            options: troopers.map((zeus) => ({
                label: zeus.label,
                value: zeus.value,
            })),
        },
        {
            id: "cozeus",
            label: "Co-Zeus",
            options: troopers.map((cozeus) => ({
                label: cozeus.label,
                value: cozeus.value,
            })),
        },
    ];
    const advancedFilterFields: DataTableAdvancedFilterField<OperationEntry>[] =
        [
            {
                id: "zeus",
                label: "Zeus",
                type: "text",
            },
            {
                id: "eventType",
                label: "Event Type",
                type: "text",
            },
            {
                id: "eventDate",
                label: "Event Date",
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
            sorting: [{ id: "eventDate", desc: true }],
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
                    >
                        <OperationsTableToolbarActions
                            table={table}
                            total={total}
                        />
                    </DataTableAdvancedToolbar>
                ) : (
                    <DataTableToolbar table={table} filterFields={filterFields}>
                        <OperationsTableToolbarActions
                            table={table}
                            total={total}
                        />
                    </DataTableToolbar>
                )}
            </DataTable>
            <EditOperationDialog
                open={rowAction?.type === "update"}
                onOpenChange={() => setRowAction(null)}
                operation={rowAction?.row.original ?? undefined}
            />
            <DeleteOperationDialog
                open={rowAction?.type === "delete"}
                onOpenChange={() => setRowAction(null)}
                operation={rowAction?.row.original ?? undefined}
            />
        </>
    );
}
