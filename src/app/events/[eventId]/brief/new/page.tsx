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

export default function NewBriefPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.eventId as string;

    const [loading, setLoading] = useState(true);
    const [troopers, setTroopers] = useState<TrooperOption[]>([]);
    const [seriesOperationType, setSeriesOperationType] = useState<string | null>(null);

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

                // Brief already exists — redirect to brief page
                if (eventData.operation) {
                    router.push(`/events/${eventId}/brief`);
                    return;
                }

                // Not an operation event — redirect back
                if (eventData.eventKind !== "Operation") {
                    router.push(`/events/${eventId}`);
                    return;
                }

                setSeriesOperationType(eventData.series?.operationType ?? null);
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

    if (loading) {
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
                        href={`/events/${eventId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Event
                    </Link>

                    <h1 className="text-2xl font-bold tracking-tight mb-1">Create Operation Brief</h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        File an operation brief for this event.
                    </p>

                    <BriefForm
                        eventId={eventId}
                        troopers={troopers}
                        seriesOperationType={seriesOperationType}
                    />
                </div>
            </div>
        </ProtectedRoute>
    );
}
