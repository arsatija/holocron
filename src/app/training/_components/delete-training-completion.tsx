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
import { TrainingEntry } from "@/lib/types";
import { deleteTrainingCompletion } from "@/services/training-completions";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteTrainingCompletionDialogProps
    extends React.ComponentPropsWithoutRef<typeof Dialog> {
    trainingCompletion: TrainingEntry | undefined;
    showTrigger?: boolean;
    onSuccess?: () => void;
}

export default function DeleteTrainingCompletionDialog(
    props: DeleteTrainingCompletionDialogProps
) {
    const { trainingCompletion } = props;

    const [isDeletePending, startDeleteTransition] = useTransition();

    function onDelete() {
        if (!trainingCompletion) return;

        startDeleteTransition(async () => {
            const { error } = await deleteTrainingCompletion(
                trainingCompletion.id
            );

            if (error) {
                toast.error(error);
                return;
            }

            props.onOpenChange?.(false);
            toast.success(`Training ${trainingCompletion.id} deleted`);
        });
    }

    return (
        <Dialog {...props}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete this trooper and remove their data from our
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
