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
import { getTroopersAsOptions } from "@/services/troopers";
import { getQualificationOptions } from "@/services/qualifications";
import { TrainingEntry } from "@/lib/types";
import EditTrainingCompletionDialog from "./edit-training-completion";
import DeleteTrainingCompletionDialog from "./delete-training-completion";
interface TrainingsTableProps {
    promises: Promise<
        [
            Awaited<ReturnType<typeof getTrainings>>,
            Awaited<ReturnType<typeof getQualificationOptions>>,
            Awaited<ReturnType<typeof getTroopersAsOptions>>
        ]
    >;
}

export function TrainingsTable({ promises }: TrainingsTableProps) {
    const { featureFlags } = useFeatureFlags();
    const [{ data, pageCount, total }, qualifications, trainers] =
        React.use(promises);
    const [rowAction, setRowAction] =
        React.useState<DataTableRowAction<TrainingEntry> | null>(null);

    const columns = React.useMemo(
        () => getColumns({ setRowAction }),
        [setRowAction]
    );

    const filterFields: DataTableFilterField<TrainingEntry>[] = [
        {
            id: "qualification",
            label: "Qualification",
            options: qualifications.map((qualification) => ({
                label: qualification.name,
                value: qualification.id,
            })),
        },
        {
            id: "trainer",
            label: "Trainer",
            options: trainers.map((trainer) => ({
                label: trainer.label,
                value: trainer.value,
            })),
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
                id: "qualification",
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
        <>
            <DataTable table={table}>
                {enableAdvancedTable ? (
                    <DataTableAdvancedToolbar
                        table={table}
                        filterFields={advancedFilterFields}
                    >
                        <TrainingsTableToolbarActions
                            table={table}
                            total={total}
                        />
                    </DataTableAdvancedToolbar>
                ) : (
                    <DataTableToolbar table={table} filterFields={filterFields}>
                        <TrainingsTableToolbarActions
                            table={table}
                            total={total}
                        />
                    </DataTableToolbar>
                )}
            </DataTable>
            <EditTrainingCompletionDialog
                open={rowAction?.type === "update"}
                onOpenChange={() => setRowAction(null)}
                trainingCompletion={rowAction?.row.original ?? undefined}
            />
            <DeleteTrainingCompletionDialog
                open={rowAction?.type === "delete"}
                onOpenChange={() => setRowAction(null)}
                trainingCompletion={rowAction?.row.original ?? undefined}
            />
        </>
    );
}
