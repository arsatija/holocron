"use client";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogFooter,
    DialogDescription,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InviteDialog() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState(
        "http://localhost:3000/auth/invite/EUrc59EHEFBmi9nBRzIQf"
    );

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        toast.success("Invite link copied to clipboard!");
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Link Generated</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    Copy the link below and send it to the recruit:
                </DialogDescription>
                <ScrollArea className="mt-2 mb-4 p-2 border rounded">
                    <code className="">{inviteLink}</code>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <DialogFooter>
                    <Button
                        onClick={handleCopyToClipboard}
                        variant="outline"
                        className="w-full"
                    >
                        Copy to Clipboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
