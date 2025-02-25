"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import OperationForm from "./operation-form";
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
                    <DialogTitle>Create Operation</DialogTitle>
                </DialogHeader>
                <OperationForm dialogCallback={dialogCallback} />
            </DialogContent>
        </Dialog>
    );
}
