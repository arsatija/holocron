"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import OperationForm from "./operation-form";
import { OperationEntry } from "@/lib/types";

interface EditOperationDialogProps
    extends React.ComponentPropsWithRef<typeof Dialog> {
    operation: OperationEntry | undefined;
}

export default function EditOperationDialog(props: EditOperationDialogProps) {
    const { operation } = props;

    return (
        <Dialog {...props}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Operation</DialogTitle>
                </DialogHeader>

                <OperationForm
                    dialogCallback={props.onOpenChange!}
                    editOperation={operation}
                />
            </DialogContent>
        </Dialog>
    );
}
