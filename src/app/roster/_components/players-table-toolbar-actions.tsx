"use client";

import { Trooper } from "@/db/schema";
import { type Table } from "@tanstack/react-table";
import CreateTrooperDialog from "./create-trooper";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";

interface PlayersTableToolbarActionsProps {
    table: Table<Trooper>;
}

export function PlayersTableToolbarActions({
    table,
}: PlayersTableToolbarActionsProps) {
    return (
        <div className="flex items-center gap-2">
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
