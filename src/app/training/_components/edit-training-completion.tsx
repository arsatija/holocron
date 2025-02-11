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
import TrainingCompletionForm from "./training-completion-form";
import { useEffect, useState, useTransition } from "react";
import { Trooper } from "@/db/schema";
import { EditTrooper, TrainingEntry } from "@/lib/types";
import { getTroopersBillet } from "@/services/billets";

interface EditTrainingCompletionDialogProps
    extends React.ComponentPropsWithRef<typeof Dialog> {
    trainingCompletion: TrainingEntry | undefined;
}

export default function EditTrainingCompletionDialog(
    props: EditTrainingCompletionDialogProps
) {
    const { trainingCompletion } = props;

    return (
        <Dialog {...props}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Training Completion</DialogTitle>
                </DialogHeader>

                <TrainingCompletionForm
                    dialogCallback={props.onOpenChange!}
                    editTrainingCompletion={trainingCompletion}
                />
            </DialogContent>
        </Dialog>
    );
}
