"use client"

import { type Player } from "@/db/schema"
import { type Table } from "@tanstack/react-table"
import { Download } from "lucide-react"

import { exportTableToCSV } from "@/lib/export"
import { Button } from "@/components/ui/button"

interface PlayersTableToolbarActionsProps {
  table: Table<Player>
}

export function PlayersTableToolbarActions({
  table,
}: PlayersTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "roster",
          })
        }
        className="gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        Export
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  )
}
