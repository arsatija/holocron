"use client";

import * as React from "react";
import { type DataTableFilterField } from "@/types";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { getColumns } from "./audit-table-columns";
import { type AuditLogEntry, type getAuditLogsForTable } from "../_lib/queries";
import { auditEntityTypeValues } from "@/lib/audit-constants";

interface AuditTableProps {
    promise: ReturnType<typeof getAuditLogsForTable>;
}

const ACTION_OPTIONS = [
    { label: "Create", value: "CREATE" },
    { label: "Update", value: "UPDATE" },
    { label: "Delete", value: "DELETE" },
];

const ENTITY_TYPE_OPTIONS = auditEntityTypeValues.map((v) => ({
    label: v.replace(/_/g, " "),
    value: v,
}));

export function AuditTable({ promise }: AuditTableProps) {
    const { data, pageCount } = React.use(promise);

    const columns = React.useMemo(() => getColumns(), []);

    const filterFields: DataTableFilterField<AuditLogEntry>[] = [
        {
            id: "action",
            label: "Action",
            options: ACTION_OPTIONS,
        },
        {
            id: "entityType",
            label: "Entity",
            options: ENTITY_TYPE_OPTIONS,
        },
    ];

    const { table } = useDataTable({
        data,
        columns,
        pageCount,
        filterFields,
        initialState: {
            sorting: [{ id: "createdAt", desc: true }],
        },
        getRowId: (row) => row.id,
        shallow: false,
        clearOnDefault: true,
    });

    return (
        <DataTable table={table}>
            <DataTableToolbar table={table} filterFields={filterFields} />
        </DataTable>
    );
}
