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
import { Button } from "@/components/ui/button";
import TrainingCompletionForm from "./training-completion-form";
import { useState, useCallback } from "react";
import { ListPlus } from "lucide-react";

export default function CreateTrainingCompletionDialog() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const dialogCallback = useCallback((open: boolean) => {
        setIsDialogOpen(open);
    }, []);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <ListPlus />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Training Completion</DialogTitle>
                </DialogHeader>
                <TrainingCompletionForm dialogCallback={dialogCallback} />
            </DialogContent>
        </Dialog>
    );
}
