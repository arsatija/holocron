"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GraduationCap, Pencil, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import { TrainingEntry, RankLevel } from "@/lib/types";
import { ProtectedComponent } from "@/components/protected-component";
import Loading from "@/app/loading";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(() => import("@/components/tiptap/editor"), {
    ssr: false,
});

const DESCRIPTION_EDIT_PERMISSIONS = [
    "training:lead",
    "training:2ic",
    "admin:lead",
    "admin:2ic",
    RankLevel.Command,
    RankLevel.Company,
];

type Qualification = {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
    description?: string | null;
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
    const [editingDescription, setEditingDescription] = useState(false);
    const [descriptionContent, setDescriptionContent] = useState("");
    const [saving, setSaving] = useState(false);

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
                    setDescriptionContent(qual?.description ?? "");
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

    async function handleSaveDescription() {
        setSaving(true);
        try {
            const res = await fetch(
                `/api/v1/qualifications/${qualificationId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ description: descriptionContent }),
                }
            );
            if (res.ok) {
                setQualification((prev) =>
                    prev ? { ...prev, description: descriptionContent } : prev
                );
                setEditingDescription(false);
            }
        } catch (error) {
            console.error("Error saving description:", error);
        } finally {
            setSaving(false);
        }
    }

    function handleCancelEdit() {
        setDescriptionContent(qualification?.description ?? "");
        setEditingDescription(false);
    }

    if (loading) {
        return <Loading />;
    }

    if (!qualification) {
        return (
            <div className="container mx-auto p-4 md:p-6">
                <p>Qualification not found</p>
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
                        <BreadcrumbPage>{qualification.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-8">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold">
                        {qualification.name}
                    </h1>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                        {qualification.abbreviation}
                    </Badge>
                    <div className="ml-auto">
                    <ProtectedComponent
                        allowedPermissions={DESCRIPTION_EDIT_PERMISSIONS}
                    >
                        {editingDescription ? (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveDescription}
                                    disabled={saving}
                                >
                                    <Save className="h-4 w-4 mr-1" />
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingDescription(true)}
                            >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                        )}
                    </ProtectedComponent>
                    </div>
                </div>
                <p className="text-muted-foreground mb-4">
                    {qualification.category}
                </p>

                {editingDescription ? (
                    <TiptapEditor
                        value={descriptionContent}
                        onChange={setDescriptionContent}
                        editable={true}
                    />
                ) : qualification.description ? (
                    <TiptapEditor
                        value={qualification.description}
                        editable={false}
                    />
                ) : (
                    <p className="text-muted-foreground text-sm">
                        No description yet.
                    </p>
                )}
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
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border hover:bg-muted transition-colors gap-1 sm:gap-0"
                                >
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
