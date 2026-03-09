"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { getFullTrooperName } from "@/lib/utils";
import { type AuditLogEntry } from "../_lib/queries";

const ACTION_STYLES: Record<string, string> = {
    CREATE: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
    UPDATE: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
    DELETE: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20",
};

function TrooperLink({ trooper }: { trooper: AuditLogEntry["actor"] }) {
    if (!trooper) return <span className="text-muted-foreground">—</span>;
    return (
        <a
            href={`/trooper/${trooper.id}`}
            className="hover:underline hover:cursor-pointer truncate max-w-[160px] block"
        >
            {getFullTrooperName(trooper)}
        </a>
    );
}

export function getColumns(): ColumnDef<AuditLogEntry>[] {
    return [
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Timestamp" />
            ),
            cell: ({ cell }) => {
                const date = cell.getValue() as Date;
                return (
                    <span className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
                        {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }).format(new Date(date))}
                    </span>
                );
            },
        },
        {
            accessorKey: "actor",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Actor" />
            ),
            cell: ({ cell }) => (
                <TrooperLink trooper={cell.getValue() as AuditLogEntry["actor"]} />
            ),
            enableSorting: false,
        },
        {
            accessorKey: "action",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Action" />
            ),
            cell: ({ cell }) => {
                const action = cell.getValue() as string;
                return (
                    <Badge
                        variant="outline"
                        className={ACTION_STYLES[action] ?? ""}
                    >
                        {action}
                    </Badge>
                );
            },
            filterFn: (row, id, value) =>
                Array.isArray(value) && value.includes(row.getValue(id)),
        },
        {
            accessorKey: "entityType",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Entity" />
            ),
            cell: ({ cell }) => (
                <Badge variant="secondary" className="font-mono text-xs">
                    {cell.getValue() as string}
                </Badge>
            ),
            filterFn: (row, id, value) =>
                Array.isArray(value) && value.includes(row.getValue(id)),
        },
        {
            accessorKey: "targetTrooper",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Affected Trooper" />
            ),
            cell: ({ cell }) => (
                <TrooperLink
                    trooper={cell.getValue() as AuditLogEntry["targetTrooper"]}
                />
            ),
            enableSorting: false,
        },
        {
            accessorKey: "entityLabel",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="What" />
            ),
            cell: ({ row }) => {
                const label = row.original.entityLabel;
                const id = row.original.entityId;
                const fields = row.original.changedFields;
                return (
                    <div className="flex flex-col gap-0.5">
                        {label ? (
                            <span className="text-sm">{label}</span>
                        ) : (
                            <span className="font-mono text-xs text-muted-foreground">
                                {id.slice(0, 8)}…
                            </span>
                        )}
                        {fields && fields.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                                {fields.join(", ")}
                            </span>
                        )}
                    </div>
                );
            },
            enableSorting: false,
        },
    ];
}
