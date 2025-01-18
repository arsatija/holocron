"use client";

import { Trooper } from "@/db/schema";
import { type Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { exportTableToCSV } from "@/lib/export";
import { Button } from "@/components/ui/button";
import CreateTrooperDialog from "./create-trooper";



interface PlayersTableToolbarActionsProps {
    table: Table<Trooper>;
}

export function PlayersTableToolbarActions({
    table,
}: PlayersTableToolbarActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <CreateTrooperDialog />
            {/**
             * Other actions can be added here.
             * For example, import, view, etc.
             */}
        </div>
    );
}
