"use client";

import { OperationEntry, RankLevel } from "@/lib/types";
import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { refresh } from "../_lib/actions";
import { RefreshCw } from "lucide-react";
import { ProtectedComponent } from "@/components/protected-component";
import CreateOperationDialog from "./create-operation";

interface OperationsTableToolbarActionsProps {
    table: Table<OperationEntry>;
    total: number;
}

export function OperationsTableToolbarActions({
    table,
    total,
}: OperationsTableToolbarActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <p className="text-sm">Operations: {total}</p>
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
                <CreateOperationDialog />
            </ProtectedComponent>
        </div>
    );
}
