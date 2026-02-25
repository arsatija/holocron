"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import { TrainingEntry } from "@/lib/types";
import Loading from "@/app/loading";

type Qualification = {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
};

export default function QualificationDetailPage() {
    const params = useParams();
    const qualificationId = params.qualificationId as string;

    const [qualification, setQualification] = useState<Qualification | null>(
        null
    );
    const [trainingSessions, setTrainingSessions] = useState<TrainingEntry[]>(
        []
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [qualResponse, trainingsResponse] = await Promise.all([
                    fetch("/api/v1/qualificationList"),
                    fetch(
                        `/api/v1/trainings?qualificationId=${qualificationId}`
                    ),
                ]);

                if (qualResponse.ok) {
                    const quals: Qualification[] = await qualResponse.json();
                    const qual = quals.find((q) => q.id === qualificationId);
                    setQualification(qual ?? null);
                }

                if (trainingsResponse.ok) {
                    const trainings: TrainingEntry[] =
                        await trainingsResponse.json();
                    setTrainingSessions(trainings);
                }
            } catch (error) {
                console.error("Error fetching qualification data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [qualificationId]);

    if (loading) {
        return <Loading />;
    }

    if (!qualification) {
        return (
            <div className="container mx-auto p-6">
                <p>Qualification not found</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/training">Training</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{qualification.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-6 flex items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold">
                            {qualification.name}
                        </h1>
                        <Badge variant="secondary" className="text-base px-3 py-1">
                            {qualification.abbreviation}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {qualification.category}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Training Sessions ({trainingSessions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {trainingSessions.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No training sessions recorded for this qualification.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {trainingSessions.map((session) => (
                                <a
                                    key={session.id}
                                    href={`/qualifications/${qualificationId}/training/${session.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium">
                                            {formatDate(session.trainingDate)}
                                        </span>
                                        {session.trainer && (
                                            <span className="text-sm text-muted-foreground">
                                                Trainer:{" "}
                                                {getFullTrooperName(
                                                    session.trainer
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {session.trainees.length} trainee
                                        {session.trainees.length !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
