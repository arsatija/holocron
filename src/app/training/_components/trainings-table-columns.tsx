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
import { RankLevel, TrainingEntry, TrooperBasicInfo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useQueryState } from "nuqs";
import { Textarea } from "@/components/ui/textarea";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CollapsibleOverflow from "@/components/collapsible-overfow";
import { redirect } from "next/navigation";

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
            accessorKey: "qualification",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Qualification" />
            ),
            accessorFn: (row) => {
                const { qualification } = row;
                return qualification.id;
            },
            cell: ({ cell }) => {
                const qualification = cell.row.original.qualification;
                if (!qualification) return "N/A";
                return (
                    <Badge variant="secondary">
                        {qualification.abbreviation}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "trainer",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Trainer" />
            ),
            accessorFn: (row) => {
                const { trainer } = row;
                return trainer?.id ?? "---";
            },
            cell: ({ cell }) => {
                const trainer = cell.row.original.trainer;
                if (!trainer) return "---";
                return (
                    <p
                        className="max-w-[200px] truncate hover:underline hover:cursor-pointer"
                        onClick={() => redirect(`/trooper/${trainer.id}`)}
                    >
                        {getFullTrooperName(trainer)}
                    </p>
                );
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
        },
        {
            accessorKey: "trainees",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Trainees" />
            ),
            accessorFn: (row) => {
                const { trainees } = row;
                return trainees.map((trainee) => trainee.id);
            },
            cell: ({ cell }) => {
                const trainees = cell.row.original.trainees;
                const traineesNames = trainees.map((trainee) => {
                    return {
                        id: trainee.id,
                        name: getFullTrooperName(trainee),
                    };
                });

                return <CollapsibleOverflow values={traineesNames} />;
            },
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
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
