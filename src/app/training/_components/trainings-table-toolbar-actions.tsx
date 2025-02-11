"use client";

import { RankLevel, TrainingEntry } from "@/lib/types";
import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { refresh } from "../_lib/actions";
import { RefreshCw } from "lucide-react";
import { ProtectedComponent } from "@/components/protected-component";
import CreateTrainingCompletionDialog from "./create-training-completion";

interface TrainingsTableToolbarActionsProps {
    table: Table<TrainingEntry>;
    total: number;
}

export function TrainingsTableToolbarActions({
    table,
    total,
}: TrainingsTableToolbarActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <p className="text-sm">Trainings: {total}</p>
            <Button size="sm" variant="outline" onClick={refresh}>
                <RefreshCw />
            </Button>
            <ProtectedComponent
                allowedPermissions={[
                    "Training",
                    RankLevel.Command,
                    RankLevel.Company,
                    RankLevel.SNCO,
                ]}
            >
                <CreateTrainingCompletionDialog />
            </ProtectedComponent>
        </div>
    );
}
