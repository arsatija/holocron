"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Circle,
    Edit,
    Lock,
    Trash2,
    Target,
    Skull,
    Users2,
    Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProtectedComponent } from "@/components/protected-component";
import { RankLevel } from "@/lib/types";
import { cn, parseLocalDate } from "@/lib/utils";
import { toast } from "sonner";
import TiptapEditor from "@/components/tiptap/editor";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion, animate } from "motion/react";
import { CampaignLoadingScreen } from "./_components/campaign-loading-screen";
import { Progress } from "@/components/ui/progress";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" as const, delay },
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface CampaignPhase {
    id: string;
    campaignId: string;
    title: string;
    subtitle: string | null;
    order: number;
    isLocked: boolean;
}

interface OperationData {
    id: string;
    operationType: string;
    operationName: string | null;
    objectives: Array<{
        title: string;
        description: string;
        type?: string;
    }> | null;
    attendanceId: string | null;
    phaseId: string | null;
    enemyKills: number;
    friendlyDeaths: number;
    eventNotes: string | null;
}

interface CampaignEvent {
    id: string;
    name: string;
    eventDate: string;
    eventTime: string | null;
    eventKind: string;
    location: string | null;
    operation: OperationData | null;
}

interface CampaignDetail {
    id: string;
    name: string;
    description: string | null;
    story: string | null;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    plannedOperationCount: number;
    phases: CampaignPhase[];
    events: CampaignEvent[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-mono tracking-[0.25em] text-muted-foreground uppercase mb-4">
            {children}
        </p>
    );
}

function StatBar({
    label,
    pct,
    initialPct,
    color,
}: {
    label: string;
    pct: number;
    initialPct: number;
    color: "green" | "red";
}) {
    const [display, setDisplay] = useState(initialPct);

    useEffect(() => {
        const controls = animate(initialPct, pct, {
            duration: 1.4,
            ease: "easeOut",
            delay: 0.5,
            onUpdate: (v) => setDisplay(Math.round(v)),
        });
        return controls.stop;
    }, [pct]);

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-mono tracking-wider text-muted-foreground">
                    {label}
                </p>
                <p
                    className={cn(
                        "text-[10px] font-mono font-semibold",
                        color === "green" ? "text-green-400" : "text-red-400",
                    )}
                >
                    {display}%
                </p>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full",
                        color === "green" ? "bg-green-500" : "bg-red-500",
                    )}
                    style={{ width: `${display}%` }}
                />
            </div>
        </div>
    );
}

function BigStat({
    label,
    value,
    color,
    icon,
}: {
    label: string;
    value: string | number;
    color: "yellow" | "red" | "muted";
    icon: React.ReactNode;
}) {
    const colorClass =
        color === "yellow"
            ? "text-yellow-400"
            : color === "red"
              ? "text-red-400"
              : "text-foreground";

    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (typeof value !== "number") return;
        const controls = animate(0, value, {
            duration: 1.8,
            ease: "easeOut",
            delay: 0.6,
            onUpdate: (v) => setDisplay(Math.round(v)),
        });
        return controls.stop;
    }, [value]);

    return (
        <div>
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-muted-foreground">{icon}</span>
                <p className="text-[10px] font-mono tracking-wider text-muted-foreground">
                    {label}
                </p>
            </div>
            <p
                className={cn(
                    "text-4xl font-mono font-bold tabular-nums",
                    colorClass,
                )}
            >
                {typeof value === "number" ? display.toLocaleString() : value}
            </p>
        </div>
    );
}

function CampaignLoading() {
    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
            <Skeleton className="h-9 w-40 mb-6" />

            {/* Header skeleton */}
            <div className="border-b border-accent9th/20 pb-8 mb-8">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-10 w-80" />
                        <Skeleton className="h-4 w-64" />
                        <div className="flex gap-2 pt-1">
                            <Skeleton className="h-8 w-36" />
                            <Skeleton className="h-8 w-36" />
                        </div>
                    </div>
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-3 w-32 ml-auto" />
                        <Skeleton className="h-3 w-28 ml-auto" />
                        <Skeleton className="h-3 w-24 ml-auto" />
                    </div>
                </div>
            </div>

            {/* Two-column skeleton */}
            <div className="grid gap-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
                <div className="space-y-10">
                    {/* Story */}
                    <div>
                        <Skeleton className="h-3 w-32 mb-4" />
                        <div className="border border-border/60 rounded-lg p-5 space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                    {/* Phases */}
                    <div>
                        <Skeleton className="h-3 w-60 mb-4" />
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="border rounded-lg p-4 space-y-2"
                                >
                                    <Skeleton className="h-2 w-12" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-2 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Operations */}
                    <div>
                        <Skeleton className="h-3 w-28 mb-4" />
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="border rounded-lg p-4 flex items-center justify-between gap-3"
                                >
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-4 w-4" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats panel skeleton */}
                <div>
                    <div className="border border-border rounded-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-border bg-muted/10">
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-1.5 w-full rounded-full" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-1.5 w-full rounded-full" />
                            </div>
                            <Skeleton className="h-px w-full" />
                            <Skeleton className="h-10 w-20" />
                            <Skeleton className="h-10 w-20" />
                            <Skeleton className="h-px w-full" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OperationRow({
    event,
    campaignId,
}: {
    event: CampaignEvent;
    campaignId: string;
}) {
    const router = useRouter();
    const op = event.operation;
    const isCompleted = !!op?.attendanceId;
    const title = op?.operationName
        ? `OPERATION ${op.operationName.toUpperCase()}`
        : event.name.toUpperCase();

    return (
        <div
            onClick={() =>
                router.push(`/events/${event.id}`)
            }
            className={cn(
                "border rounded-lg p-4 cursor-pointer transition-all duration-200 group",
                isCompleted
                    ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                    : "border-border hover:border-accent9th/40 bg-card/30",
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={cn(
                                "font-mono font-bold text-lg truncate",
                                isCompleted ? "line-through" : "",
                            )}
                        >
                            {title}
                        </span>
                        {isCompleted && (
                            <Badge className="text-[10px] font-mono py-0 bg-green-500/20 text-green-400 border border-green-500/30">
                                COMPLETED
                            </Badge>
                        )}
                        {op?.operationType && (
                            <Badge
                                variant="outline"
                                className="text-[10px] font-mono py-0"
                            >
                                {op.operationType.toUpperCase()}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground flex-wrap">
                        <span>
                            {format(
                                parseLocalDate(event.eventDate),
                                "dd MMM yyyy",
                            ).toUpperCase()}
                        </span>
                        {event.location && (
                            <span className="flex items-center gap-1">
                                <span>◉</span>
                                {event.location.toUpperCase()}
                            </span>
                        )}
                        {op?.objectives?.length ? (
                            <span>◎ {op.objectives.length} OBJ</span>
                        ) : null}
                        {(op?.enemyKills ?? 0) > 0 && (
                            <span className="text-green-400">
                                † {op!.enemyKills} ELIM
                            </span>
                        )}
                        {(op?.friendlyDeaths ?? 0) > 0 && (
                            <span className="text-red-400">
                                ✝ {op!.friendlyDeaths} KIA
                            </span>
                        )}
                    </div>
                    <div className="text-muted-foreground text-xs font-mono uppercase gap-4 flex flex-wrap">
                        <div className="flex flex-row gap-1">
                            <Skull className="text-red-400 h-3.5 w-3.5" />
                            <span className="text-xs">
                                Eliminated: {""}{" "}
                                <span className="font-bold text-red-400">
                                    {op?.enemyKills ?? 0}
                                </span>
                            </span>
                        </div>
                        <div className="flex flex-row gap-1">
                            <Users2 className="text-yellow-400 h-3.5 w-3.5" />
                            <span className="text-xs">
                                KIA: {""}{" "}
                                <span className="font-bold text-yellow-400">
                                    {op?.friendlyDeaths ?? 0}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent9th transition-colors flex-shrink-0" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params.campaignId as string;

    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [dataReady, setDataReady] = useState(false);
    const [animationDone, setAnimationDone] = useState(false);
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const phasesScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchCampaign();
    }, [campaignId]);

    useEffect(() => {
        const el = phasesScrollRef.current;
        if (!el) return;
        setShowScrollHint(el.scrollWidth > el.clientWidth);
    }, [campaign?.phases]);

    const fetchCampaign = async () => {
        try {
            const res = await fetch(`/api/v1/campaigns/${campaignId}`);
            if (res.ok) {
                const data = await res.json();
                setCampaign(data);
            } else {
                toast.error("Failed to load campaign");
            }
        } catch {
            toast.error("Failed to load campaign");
        } finally {
            setDataReady(true);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/v1/campaigns/${campaignId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Campaign deleted");
                router.push("/campaigns");
            } else {
                toast.error("Failed to delete campaign");
            }
        } catch {
            toast.error("Failed to delete campaign");
        }
    };

    const showLoading = !dataReady || !animationDone;

    if (showLoading) {
        return (
            <AnimatePresence>
                <CampaignLoadingScreen
                    onComplete={() => setAnimationDone(true)}
                />
            </AnimatePresence>
        );
    }

    if (!campaign) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-muted-foreground">Campaign not found</p>
            </div>
        );
    }

    // ── Stats computation ──────────────────────────────────────────────────
    const opEvents = campaign.events.filter(
        (e) => e.eventKind === "Operation" && e.operation,
    );
    const totalOps = opEvents.length;
    const completedOps = opEvents.filter(
        (e) => e.operation?.attendanceId,
    ).length;
    const totalObjectives = opEvents.reduce(
        (sum, e) => sum + (e.operation?.objectives?.length ?? 0),
        0,
    );
    const completedObjectives = opEvents
        .filter((e) => e.operation?.attendanceId)
        .reduce((sum, e) => sum + (e.operation?.objectives?.length ?? 0), 0);
    const systemControlPct =
        totalObjectives > 0
            ? Math.round((completedObjectives / totalObjectives) * 100)
            : 0;
    const enemyStrengthPct = 100 - systemControlPct;
    const totalEnemyKills = opEvents.reduce(
        (sum, e) => sum + (e.operation?.enemyKills ?? 0),
        0,
    );
    const totalFriendlyDeaths = opEvents.reduce(
        (sum, e) => sum + (e.operation?.friendlyDeaths ?? 0),
        0,
    );
    const opProgress =
        totalOps > 0 ? Math.round((completedOps / totalOps) * 100) : 0;

    // ── Phase filtering ────────────────────────────────────────────────────
    const phases = campaign.phases;
    const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? null;
    const filteredEvents = selectedPhaseId
        ? opEvents.filter((e) => e.operation?.phaseId === selectedPhaseId)
        : opEvents;

    // Unassigned ops count (no phase)
    const unassignedOps = opEvents.filter((e) => !e.operation?.phaseId);

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
            {/* ── Top bar ─────────────────────────────────────────────── */}
            <motion.div
                {...fadeUp(0)}
                className="flex items-center justify-between mb-6"
            >
                <Button
                    variant="ghost"
                    className="-ml-2"
                    onClick={() => router.push("/campaigns")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    All Campaigns
                </Button>
                <ProtectedComponent
                    allowedPermissions={[
                        RankLevel.Command,
                        RankLevel.Company,
                        "sgd:2ic",
                        "sgd-lore:2ic",
                        "admin:2ic",
                    ]}
                >
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="font-mono text-xs tracking-wider"
                            onClick={() =>
                                router.push(`/campaigns/${campaign.id}/edit`)
                            }
                        >
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            EDIT CAMPAIGN
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="font-mono text-xs tracking-wider text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </ProtectedComponent>
            </motion.div>

            {/* ── Header ─────────────────────────────────────────────── */}
            <motion.div
                {...fadeUp(0.1)}
                className="border-b border-accent9th/20 pb-8 mb-8"
            >
                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div>
                        <p className="text-[10px] font-mono tracking-[0.25em] text-muted-foreground mb-2 uppercase">
                            Command Overview // Tactical Operations Center
                        </p>
                        <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight leading-none">
                            CAMPAIGN:
                            <span className="text-accent9th pl-1">
                                {campaign.name.toUpperCase()}
                            </span>
                        </h1>
                        {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                                {campaign.description}
                            </p>
                        )}
                    </div>
                    <div className="text-right font-mono text-[10px] text-muted-foreground space-y-1">
                        <p>
                            CAMPAIGN-ID: {campaign.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p>
                            STARTED:{" "}
                            {format(
                                parseLocalDate(campaign.startDate),
                                "dd MMM yyyy",
                            ).toUpperCase()}
                        </p>
                        {campaign.endDate && (
                            <p>
                                CONCLUDED:{" "}
                                {format(
                                    parseLocalDate(campaign.endDate),
                                    "dd MMM yyyy",
                                ).toUpperCase()}
                            </p>
                        )}
                        <p
                            className={cn(
                                "font-semibold text-xs",
                                campaign.isActive
                                    ? "text-green-400"
                                    : "text-muted-foreground",
                            )}
                        >
                            STATUS: {campaign.isActive ? "ACTIVE" : "CONCLUDED"}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ── Main Grid ──────────────────────────────────────────── */}
            <div className="grid gap-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
                {/* Left column */}
                <div className="space-y-10 min-w-0">
                    {/* Situation Report / Story */}
                    {campaign.story && (
                        <motion.section {...fadeUp(0.2)}>
                            <SectionLabel>Situation Report</SectionLabel>
                            <div className="border border-border/60 rounded-lg p-5 bg-card/30">
                                <TiptapEditor
                                    value={campaign.story}
                                    editable={false}
                                    className="prose prose-zinc dark:prose-invert max-w-none border-0"
                                />
                            </div>
                        </motion.section>
                    )}

                    {/* Campaign Phases */}
                    {phases.length > 0 && (
                        <motion.section {...fadeUp(campaign.story ? 0.3 : 0.2)}>
                            <SectionLabel>Campaign Phases</SectionLabel>
                            <div className="relative">
                                <div
                                    ref={phasesScrollRef}
                                    onScroll={(e) => {
                                        const el = e.currentTarget;
                                        setShowScrollHint(
                                            el.scrollLeft + el.clientWidth <
                                                el.scrollWidth - 4,
                                        );
                                    }}
                                    className="flex items-stretch overflow-x-auto pb-3 mb-6 gap-2 scrollbar-thin"
                                >
                                    {phases.map((phase, i) => {
                                        const phaseOps = opEvents.filter(
                                            (e) =>
                                                e.operation?.phaseId ===
                                                phase.id,
                                        );
                                        const phaseCompleted = phaseOps.filter(
                                            (e) => e.operation?.attendanceId,
                                        ).length;
                                        const isAllComplete =
                                            phaseOps.length > 0 &&
                                            phaseCompleted === phaseOps.length;
                                        const isSelected =
                                            selectedPhaseId === phase.id;

                                        return (
                                            <div
                                                key={phase.id}
                                                onClick={() =>
                                                    !phase.isLocked &&
                                                    setSelectedPhaseId(
                                                        isSelected
                                                            ? null
                                                            : phase.id,
                                                    )
                                                }
                                                className={cn(
                                                    "w-60 h-36 shrink-0 flex flex-col p-4 border rounded-lg transition-all duration-200 justify-between",
                                                    phase.isLocked
                                                        ? "border-border/40 bg-muted/20 opacity-60 cursor-not-allowed"
                                                        : isSelected
                                                          ? "border-accent9th bg-accent9th/10 cursor-pointer"
                                                          : "border-border hover:border-accent9th/40 bg-card/30 cursor-pointer",
                                                )}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <p className="text-[9px] font-mono tracking-widest text-muted-foreground">
                                                            PHASE {i + 1}
                                                        </p>
                                                        {phase.isLocked ? (
                                                            <Lock className="h-5 w-5 shrink-0 text-muted-foreground/70" />
                                                        ) : isAllComplete ? (
                                                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                                                        ) : (
                                                            <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                                                        )}
                                                    </div>

                                                    <p className="font-mono font-bold text-sm leading-tight mb-1 truncate">
                                                        {phase.title.toUpperCase()}
                                                    </p>
                                                    {phase.subtitle && (
                                                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                                                            {phase.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Progress
                                                        value={
                                                            phaseOps.length ===
                                                            0
                                                                ? 0
                                                                : (phaseCompleted /
                                                                      phaseOps.length) *
                                                                  100
                                                        }
                                                    />
                                                    <p className="text-[9px] font-mono text-muted-foreground mt-1">
                                                        {phaseCompleted}/
                                                        {phaseOps.length}{" "}
                                                        OPERATIONS
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Scroll hint fade */}
                                {showScrollHint && (
                                    <div className="absolute right-0 top-0 bottom-3 w-16 pointer-events-none bg-gradient-to-l from-background to-transparent rounded-r-lg" />
                                )}
                            </div>
                        </motion.section>
                    )}

                    {/* Operations List */}
                    <motion.section {...fadeUp(0.4)}>
                        <div className="flex items-center justify-between">
                            <SectionLabel>
                                {selectedPhase
                                    ? `Phase ${phases.indexOf(selectedPhase) + 1}: ${selectedPhase.title} Operations`
                                    : "All Operations"}
                            </SectionLabel>
                            {selectedPhaseId && (
                                <button
                                    onClick={() => setSelectedPhaseId(null)}
                                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors -mt-4"
                                >
                                    SHOW ALL
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {filteredEvents.length === 0 ? (
                                <div className="border border-dashed border-border rounded-lg p-8 text-center">
                                    <p className="text-xs font-mono text-muted-foreground">
                                        NO OPERATIONS{" "}
                                        {selectedPhaseId
                                            ? "FOR THIS PHASE"
                                            : "IN THIS CAMPAIGN"}
                                    </p>
                                </div>
                            ) : (
                                filteredEvents.map((event) => (
                                    <OperationRow
                                        key={event.id}
                                        event={event}
                                        campaignId={campaign.id}
                                    />
                                ))
                            )}
                        </div>

                        {!selectedPhaseId &&
                            phases.length > 0 &&
                            unassignedOps.length > 0 && (
                                <p className="text-[10px] font-mono text-muted-foreground mt-3 text-right">
                                    {unassignedOps.length} operation
                                    {unassignedOps.length !== 1 ? "s" : ""} not
                                    assigned to a phase
                                </p>
                            )}
                    </motion.section>
                </div>

                {/* Right column — Stats Panel */}
                <motion.div
                    {...fadeUp(0.25)}
                    className="lg:sticky lg:top-6 space-y-4 self-start"
                >
                    <div className="border border-border rounded-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-border bg-muted/10">
                            <h2 className="text-sm font-mono font-bold tracking-[0.25em] text-foreground uppercase">
                                Campaign Status
                            </h2>
                        </div>
                        <div className="p-5 space-y-5">
                            <StatBar
                                label="SYSTEM CONTROL"
                                pct={systemControlPct}
                                initialPct={0}
                                color="green"
                            />
                            <StatBar
                                label="ENEMY STRENGTH"
                                pct={enemyStrengthPct}
                                initialPct={100}
                                color="red"
                            />

                            <Separator />

                            <BigStat
                                label="ENEMY KILLS"
                                value={totalEnemyKills}
                                color="red"
                                icon={
                                    <Skull className="h-3 w-3 text-red-400" />
                                }
                            />
                            <BigStat
                                label="KIA"
                                value={totalFriendlyDeaths}
                                color="yellow"
                                icon={
                                    <Users2 className="h-3 w-3 text-yellow-400" />
                                }
                            />

                            <Separator />

                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Swords className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-[10px] font-mono tracking-wider text-muted-foreground">
                                        OPERATIONS
                                    </p>
                                </div>
                                <p className="text-xl font-mono font-bold tabular-nums">
                                    {completedOps}
                                    <span className="text-muted-foreground font-normal">
                                        /{totalOps}
                                    </span>
                                </p>
                                <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                                    <motion.div
                                        className="h-2 w-full bg-accent9th rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${opProgress}%` }}
                                        transition={{
                                            duration: 1.4,
                                            ease: "easeOut",
                                            delay: 0.5,
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Target className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-[10px] font-mono tracking-wider text-muted-foreground">
                                        OBJECTIVES
                                    </p>
                                </div>
                                <p className="text-xl font-mono font-bold tabular-nums">
                                    {completedObjectives}
                                    <span className="text-muted-foreground font-normal">
                                        /{totalObjectives}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <strong>{campaign.name}</strong> and all its phases.
                            Campaign events will be unlinked but not deleted.
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
