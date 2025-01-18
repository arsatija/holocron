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
import TrooperForm from "./trooper-form";
import { useState, useCallback } from "react";

export default function CreateTrooperDialog() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const dialogCallback = useCallback((open: boolean) => {
        setIsDialogOpen(open);
    }, []);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Create Trooper</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Trooper</DialogTitle>
                </DialogHeader>
                <TrooperForm dialogCallback={dialogCallback} />
            </DialogContent>
        </Dialog>
    );
}
