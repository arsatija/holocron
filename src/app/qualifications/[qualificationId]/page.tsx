"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GraduationCap, Pencil, X, Save, ChevronLeft, ChevronRight } from "lucide-react";
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
    const [trainingsLoading, setTrainingsLoading] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [descriptionContent, setDescriptionContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 20;

    useEffect(() => {
        async function fetchQual() {
            try {
                const qualResponse = await fetch("/api/v1/qualificationList");
                if (qualResponse.ok) {
                    const quals: Qualification[] = await qualResponse.json();
                    const qual = quals.find((q) => q.id === qualificationId);
                    setQualification(qual ?? null);
                    setDescriptionContent(qual?.description ?? "");
                }
            } catch (error) {
                console.error("Error fetching qualification data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchQual();
    }, [qualificationId]);

    useEffect(() => {
        async function fetchTrainings() {
            setTrainingsLoading(true);
            try {
                const response = await fetch(
                    `/api/v1/trainings?qualificationId=${qualificationId}&page=${page}&limit=${LIMIT}`
                );
                if (response.ok) {
                    const result = await response.json();
                    setTrainingSessions(result.data);
                    setPageCount(result.pageCount);
                    setTotal(result.total);
                }
            } catch (error) {
                console.error("Error fetching trainings:", error);
            } finally {
                setTrainingsLoading(false);
            }
        }
        fetchTrainings();
    }, [qualificationId, page]);

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
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="relative w-full bg-background border-b border-border overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.12] dark:opacity-[0.35]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                        maskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                    }}
                />
                <div className="relative container mx-auto px-4 py-10 md:py-14 text-center">
                    <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                        {qualification.category} Qualification
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#993534]">
                            {qualification.name}
                        </h1>
                        <Badge
                            variant="secondary"
                            className="font-mono text-sm border border-[#993534]/30 bg-[#993534]/10 text-foreground shrink-0"
                        >
                            {qualification.abbreviation}
                        </Badge>
                    </div>
                </div>
            </div>

        <div className="container mx-auto p-4 md:p-6 max-w-5xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <Breadcrumb>
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

                <ProtectedComponent allowedPermissions={DESCRIPTION_EDIT_PERMISSIONS}>
                    <div className="flex gap-2">
                        {editingDescription ? (
                            <>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveDescription} disabled={saving}>
                                    <Save className="h-4 w-4 mr-1" />
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </>
                        ) : (
                            <Button size="sm" variant="ghost" onClick={() => setEditingDescription(true)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit Description
                            </Button>
                        )}
                    </div>
                </ProtectedComponent>
            </div>

            <div className="mb-8">

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
                        Training Sessions ({total})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {trainingsLoading ? (
                        <p className="text-muted-foreground text-sm">Loading...</p>
                    ) : trainingSessions.length === 0 ? (
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
                            {pageCount > 1 && (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => p - 1)}
                                            disabled={page <= 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage((p) => p + 1)}
                                            disabled={page >= pageCount}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        </div>
    );
}
