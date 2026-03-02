"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";
import BriefForm from "../_components/brief-form";

type TrooperOption = { label: string; value: string };

type ExistingBrief = {
    operationType: string;
    operationName: string | null;
    transmittedById: string | null;
    deployedForces: Array<{ name: string; optional: boolean }> | null;
    objectives: Array<{ title: string; description: string }> | null;
    situationReport: string | null;
    eventNotes: string | null;
};

export default function EditBriefPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.eventId as string;

    const [loading, setLoading] = useState(true);
    const [troopers, setTroopers] = useState<TrooperOption[]>([]);
    const [existing, setExisting] = useState<ExistingBrief | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [eventRes, troopersRes] = await Promise.all([
                    fetch(`/api/v1/events/${eventId}`),
                    fetch("/api/v1/troopersList"),
                ]);

                if (!eventRes.ok) {
                    toast.error("Event not found");
                    router.push("/events");
                    return;
                }

                const [eventData, troopersData] = await Promise.all([
                    eventRes.json(),
                    troopersRes.json() as Promise<TrooperOption[]>,
                ]);

                // No brief exists — redirect to create
                if (!eventData.operation) {
                    router.push(`/events/${eventId}/brief/new`);
                    return;
                }

                setExisting({
                    operationType: eventData.operation.operationType,
                    operationName: eventData.operation.operationName ?? null,
                    transmittedById: eventData.operation.transmittedById ?? null,
                    deployedForces: eventData.operation.deployedForces ?? null,
                    objectives: eventData.operation.objectives ?? null,
                    situationReport: eventData.operation.situationReport ?? null,
                    eventNotes: eventData.operation.eventNotes ?? null,
                });
                setTroopers(troopersData);
            } catch {
                toast.error("Failed to load");
                router.push("/events");
            } finally {
                setLoading(false);
            }
        }

        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    if (loading || !existing) {
        return (
            <div className="flex items-center justify-center min-h-screen-header">
                <Loader2 className="h-8 w-8 animate-spin text-accent9th" />
            </div>
        );
    }

    return (
        <ProtectedRoute allowedPermissions={["Zeus", "Admin", RankLevel.Command]}>
            <div className="min-h-screen-header bg-background">
                <div className="px-6 md:px-10 py-8">
                    <Link
                        href={`/events/${eventId}/brief`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Brief
                    </Link>

                    <h1 className="text-2xl font-bold tracking-tight mb-1">Edit Operation Brief</h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        Update the operation brief details.
                    </p>

                    <BriefForm
                        eventId={eventId}
                        troopers={troopers}
                        existing={existing}
                    />
                </div>
            </div>
        </ProtectedRoute>
    );
}
