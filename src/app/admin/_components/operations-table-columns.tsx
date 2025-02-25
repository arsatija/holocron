"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/types";
import { type ColumnDef } from "@tanstack/react-table";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel, OperationEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import CollapsibleOverflow from "@/components/collapsible-overfow";
import { redirect } from "next/navigation";

interface GetColumnsProps {
    setRowAction: React.Dispatch<
        React.SetStateAction<DataTableRowAction<OperationEntry> | null>
    >;
}

export function getColumns({
    setRowAction,
}: GetColumnsProps): ColumnDef<OperationEntry>[] {
    return [
        {
            accessorKey: "eventDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date" />
            ),
            cell: ({ cell }) => formatDate(cell.getValue() as Date),
        },
        {
            accessorKey: "eventType",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Operation Type" />
            ),
            cell: ({ cell }) => {
                const eventType = cell.row.original.eventType;
                if (!eventType) return "N/A";
                return <Badge variant="secondary">{eventType}</Badge>;
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "zeus",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Zeus" />
            ),
            accessorFn: (row) => {
                const { zeus } = row;
                return zeus?.id ?? "---";
            },
            cell: ({ cell }) => {
                const zeus = cell.row.original.zeus;
                if (!zeus) return "---";
                return (
                    <a
                        className="max-w-[200px] truncate hover:underline hover:cursor-pointer"
                        href={`/trooper/${zeus.id}`}
                    >
                        {getFullTrooperName(zeus)}
                    </a>
                );
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "cozeus",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Co-Zeuses" />
            ),
            accessorFn: (row) => {
                const { cozeus } = row;
                return cozeus.map((cz) => cz.id);
            },
            cell: ({ cell }) => {
                const cozeus = cell.row.original.cozeus;
                const cozeusNames = cozeus.map((cz) => {
                    return {
                        id: cz.id,
                        name: getFullTrooperName(cz),
                    };
                });

                return <CollapsibleOverflow values={cozeusNames} />;
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
            enableSorting: false,
        },
        {
            accessorKey: "attendees",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Attendees" />
            ),
            accessorFn: (row) => {
                const { attendees } = row;
                return attendees.map((attendee) => attendee.id);
            },
            cell: ({ cell }) => {
                const attendees = cell.row.original.attendees;
                const attendeesNames = attendees.map((attendee) => {
                    return {
                        id: attendee.id,
                        name: getFullTrooperName(attendee),
                    };
                });

                return <CollapsibleOverflow values={attendeesNames} />;
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "eventNotes",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Notes" />
            ),
            cell: ({ cell }) => (
                <p className="max-w-[200px] truncate">
                    <Textarea
                        value={(cell.getValue() as string) ?? ""}
                        disabled
                    />
                </p>
            ),
        },
        {
            id: "actions",
            cell: function Cell({ row }) {
                return (
                    <div className="flex justify-end gap-x-4">
                        <ProtectedComponent
                            allowedPermissions={[
                                "Admin",
                                RankLevel.Command,
                                RankLevel.Company,
                            ]}
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        aria-label="Open menu"
                                        variant="ghost"
                                        className="flex size-8 p-0 data-[state=open]:bg-muted"
                                    >
                                        <Ellipsis
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                >
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            setRowAction({
                                                row,
                                                type: "update",
                                            })
                                        }
                                    >
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            setRowAction({
                                                row,
                                                type: "delete",
                                            })
                                        }
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </ProtectedComponent>
                    </div>
                );
            },
        },
    ];
}
