"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Edit,
    Notebook,
    Trash2,
    Users,
    UserCheck,
} from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel, TrainingEntry } from "@/lib/types";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditTrainingCompletionDialog from "@/app/training/_components/edit-training-completion";
import { deleteTrainingCompletion } from "@/services/trainings";
import Loading from "@/app/loading";

export default function TrainingDetailPage() {
    const router = useRouter();
    const params = useParams();
    const qualificationId = params.qualificationId as string;
    const trainingId = params.trainingId as string;

    const [training, setTraining] = useState<TrainingEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    useEffect(() => {
        fetchTraining();
    }, [trainingId]);

    const fetchTraining = async () => {
        try {
            const response = await fetch(
                `/api/v1/trainings/${trainingId}`
            );
            if (response.ok) {
                const data: TrainingEntry = await response.json();
                setTraining(data);
            } else {
                toast.error("Failed to load training session");
            }
        } catch (error) {
            console.error("Error fetching training:", error);
            toast.error("Failed to load training session");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const result = await deleteTrainingCompletion(trainingId);
        if (result.error) {
            toast.error(String(result.error));
            return;
        }
        toast.success("Training session deleted");
        router.push(`/qualifications/${qualificationId}`);
    };

    const handleEditClose = (open: boolean) => {
        setEditDialogOpen(open);
        if (!open) {
            fetchTraining();
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (!training) {
        return (
            <div className="container mx-auto p-4 md:p-6">
                <p>Training session not found</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-5xl">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/training">Training</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/qualifications/${qualificationId}`}>
                            {training.qualification.name}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>
                            {formatDate(training.trainingDate)}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h1 className="text-2xl md:text-3xl font-bold">
                            {training.qualification.name}
                        </h1>
                        <Badge variant="secondary" className="text-base px-3 py-1">
                            {training.qualification.abbreviation}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {formatDate(training.trainingDate)}
                    </p>
                </div>
                <ProtectedComponent
                    allowedPermissions={[
                        "Admin",
                        RankLevel.Command,
                        RankLevel.Company,
                    ]}
                >
                    <div className="flex gap-2">
                        <Button onClick={() => setEditDialogOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </ProtectedComponent>
            </div>

            {training.trainer && (
                <Card className="mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Trainer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={`/trooper/${training.trainer.id}`}
                            className="text-lg font-medium hover:underline"
                        >
                            {getFullTrooperName(training.trainer)}
                        </a>
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Trainees ({training.trainees.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {training.trainees.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No trainees recorded.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {training.trainees.map((trainee) => (
                                <a
                                    key={trainee.id}
                                    href={`/trooper/${trainee.id}`}
                                    className="block font-medium hover:underline"
                                >
                                    {getFullTrooperName(trainee)}
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {training.trainingNotes && (
                <Card className="mb-6">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Notebook className="h-4 w-4" />
                            Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-line">
                            {training.trainingNotes}
                        </p>
                    </CardContent>
                </Card>
            )}

            <EditTrainingCompletionDialog
                open={editDialogOpen}
                onOpenChange={handleEditClose}
                trainingCompletion={training}
            />

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this training session and remove the
                            qualification from all trainees.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
