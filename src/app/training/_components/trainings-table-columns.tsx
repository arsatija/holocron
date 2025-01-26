"use client";

import * as React from "react";
import { type DataTableRowAction } from "@/types";
import { type ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
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
import { RankLevel, TrainingEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useQueryState } from "nuqs";
import { Textarea } from "@/components/ui/textarea";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import CollapsibleOverflow from "@/components/collapsible-overfow";

interface GetColumnsProps {
    setRowAction: React.Dispatch<
        React.SetStateAction<DataTableRowAction<TrainingEntry> | null>
    >;
}

export function getColumns({
    setRowAction,
}: GetColumnsProps): ColumnDef<TrainingEntry>[] {
    return [
        {
            accessorKey: "trainingDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date" />
            ),
            cell: ({ cell }) => formatDate(cell.getValue() as Date),
        },
        {
            accessorKey: "qualificationAbbreviation",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Qualification" />
            ),
            cell: ({ cell }) => (
                <Badge variant="secondary">{cell.getValue() as string}</Badge>
            ),
        },
        {
            accessorKey: "trainer",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Trainer" />
            ),
        },
        {
            accessorKey: "trainees",
            enableSorting: false,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Trainees" />
            ),
            cell: ({ cell }) => (
                <CollapsibleOverflow values={cell.getValue() as string[]} />
            ),
        },
        {
            accessorKey: "trainingNotes",
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
