"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import TrooperForm from "./trooper-form";
import { useEffect, useState, useTransition } from "react";
import { Trooper } from "@/db/schema";
import { EditTrooper } from "@/lib/types";
import { getTroopersBillet } from "@/services/billets";

interface EditTrooperDialogProps
    extends React.ComponentPropsWithRef<typeof Dialog> {
    trooper: Trooper | undefined;
}

export default function EditTrooperDialog(props: EditTrooperDialogProps) {
    const { trooper } = props;

    let trooperWithBillet: EditTrooper | undefined;
    if (trooper) {
        trooperWithBillet = {
            id: trooper.id,
            numbers: trooper.numbers,
            name: trooper.name,
            rank: trooper.rank,
            recruitmentDate: trooper.recruitmentDate,
            status: trooper.status,
            billetId: "",
            departmentPositions: [],
        };
    }

    return (
        <Dialog {...props}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Trooper</DialogTitle>
                </DialogHeader>

                <TrooperForm
                    dialogCallback={props.onOpenChange!}
                    editTrooper={trooperWithBillet}
                />
            </DialogContent>
        </Dialog>
    );
}
