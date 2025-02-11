"use client";

import { Trooper } from "@/db/schema";
import { type Table } from "@tanstack/react-table";
import CreateTrooperDialog from "./create-trooper";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { refresh } from "../_lib/actions";
import { RefreshCw } from "lucide-react";

interface PlayersTableToolbarActionsProps {
    table: Table<Trooper>;
}

export function PlayersTableToolbarActions({
    table,
}: PlayersTableToolbarActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refresh}>
                <RefreshCw />
            </Button>
            <ProtectedComponent
                allowedPermissions={[
                    "Admin",
                    RankLevel.Command,
                    RankLevel.Company,
                    RankLevel.SNCO,
                ]}
            >
                <CreateTrooperDialog />
            </ProtectedComponent>
            {/**
             * Other actions can be added here.
             * For example, import, view, etc.
             */}
        </div>
    );
}
