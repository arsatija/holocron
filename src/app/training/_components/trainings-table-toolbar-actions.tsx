"use client";

import { TrainingEntry } from "@/lib/types";
import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { refresh } from "../_lib/actions";
import { RefreshCw } from "lucide-react";

interface TrainingsTableToolbarActionsProps {
    table: Table<TrainingEntry>;
}

export function TrainingsTableToolbarActions({
    table,
}: TrainingsTableToolbarActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refresh}>
                <RefreshCw />
            </Button>
        </div>
    );
}
