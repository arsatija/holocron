"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Trooper } from "@/db/schema";
import { ranks } from "@/lib/definitions";
import { CellAction } from "./cell-action";

export const playersColumns: ColumnDef<Trooper>[] = [
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status;
            let color = "";
            if (status == "Active") color = "text-green-400";
            else if (status == "Inactive") color = "text-orange-400";
            else if (status == "Discharged") color = "text-red-400";

            return <p className={color}>{row.original.status}</p>;
        },
    },
    {
        accessorFn: (row) => {
            const { rank } = row;
            return ranks[rank].name;
        },
        header: "Rank",
    },
    {
        accessorFn: (row) => {
            const { rank, numbers, name } = row;
            return `${ranks[rank].abbreviation}-${numbers} "${name}"`;
        },
        header: "Name",
    },
    {
        accessorKey: "recruitmentDate",
        header: "Recruitment Date",
    },
    {
        accessorKey: "attendances",
        header: "Attendances",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
