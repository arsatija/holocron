"use client"

import * as React from "react"
import { players, type Player } from "@/db/schema"
import { type DataTableRowAction } from "@/types"
import { type ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/utils"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { ranks } from "@/lib/definitions"

interface GetColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Player> | null>
  >
}

export function getColumns({
  setRowAction,
}: GetColumnsProps): ColumnDef<Player>[] {
  return [
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({row}) => {
          const status = row.original.status;
          let color = "";
          if (status == "Active") color = "text-green-400";
          else if (status == "Inactive") color = "text-orange-400";
          else if (status == "Discharged") color = "text-red-400";
  
          return <p className={color}>{row.original.status}</p>
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id))
      },
    },
    {
      id: "rank",
      accessorFn: (row) => {
          const {rank} = row;
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
        <DataTableColumnHeader column={column} title="Recruitment Date" />
      ),
      cell: ({ cell }) => formatDate(cell.getValue() as Date),
    },
    {
      accessorKey: "attendances",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title=" Attendances" />
      ),
    },
  ]
}
