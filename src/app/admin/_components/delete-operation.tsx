"use client";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OperationEntry } from "@/lib/types";
import { deleteOperation } from "@/services/operations";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteOperationDialogProps
    extends React.ComponentPropsWithoutRef<typeof Dialog> {
    operation: OperationEntry | undefined;
    showTrigger?: boolean;
    onSuccess?: () => void;
}

export default function DeleteOperationDialog(
    props: DeleteOperationDialogProps
) {
    const { operation } = props;

    const [isDeletePending, startDeleteTransition] = useTransition();

    function onDelete() {
        if (!operation) return;

        startDeleteTransition(async () => {
            const { error } = await deleteOperation(operation.id);

            if (error) {
                toast.error(error);
                return;
            }

            props.onOpenChange?.(false);
            toast.success(`Operation ${operation.id} deleted`);
        });
    }

    return (
        <Dialog {...props}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete this operation and remove its data from our
                        servers.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose>Cancel</DialogClose>
                    <DialogClose asChild>
                        <Button
                            variant="destructive"
                            disabled={isDeletePending}
                            onClick={onDelete}
                        >
                            {isDeletePending && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Delete
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
