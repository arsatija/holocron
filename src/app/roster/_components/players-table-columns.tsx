"use client";

import * as React from "react";
import { type Trooper } from "@/db/schema";
import { type DataTableRowAction } from "@/types";
import { type ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { ranks } from "@/lib/definitions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { redirect } from "next/navigation";

interface GetColumnsProps {
    setRowAction: React.Dispatch<
        React.SetStateAction<DataTableRowAction<Trooper> | null>
    >;
}

export function getColumns({
    setRowAction,
}: GetColumnsProps): ColumnDef<Trooper>[] {
    return [
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.original.status;
                let color = "";
                if (status == "Active") color = "text-green-400";
                else if (status == "Inactive") color = "text-orange-400";
                else if (status == "Discharged") color = "text-red-400";

                return <p className={color}>{row.original.status}</p>;
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
        },
        {
            id: "rank",
            accessorFn: (row) => {
                const { rank } = row;
                return ranks[rank].name;
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Rank" />
            ),
        },
        {
            accessorKey: "numbers",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Numbers" />
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            enableSorting: true,
        },
        {
            accessorKey: "recruitmentDate",
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Recruitment Date"
                />
            ),
            cell: ({ cell }) => formatDate(cell.getValue() as Date),
        },
        {
            accessorKey: "attendances",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title=" Attendances" />
            ),
        },
        {
            id: "actions",
            cell: function Cell({ row }) {
                const [isUpdatePending, startUpdateTransition] =
                    React.useTransition();

                return (
                    <div className="flex justify-end gap-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                redirect(`/trooper/${row.original.id}`)
                            }
                        >
                            <ExternalLink />
                        </Button>
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
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                    onSelect={() =>
                                        setRowAction({ row, type: "update" })
                                    }
                                >
                                    Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onSelect={() =>
                                        setRowAction({ row, type: "delete" })
                                    }
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
}
