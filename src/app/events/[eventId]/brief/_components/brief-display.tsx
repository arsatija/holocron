"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { format } from "date-fns";
import { parseLocalDate } from "@/lib/utils";
import {
    ArrowLeft,
    Shield,
    Target,
    Users,
    AlertTriangle,
    FileText,
} from "lucide-react";
import { BriefLoadingScreen } from "./brief-loading-screen";
import BriefActions from "./brief-actions";
import TiptapEditor from "@/components/tiptap/editor";

export interface BriefData {
    eventId: string;
    eventDate: string;
    eventTime: string | null;
    campaignName: string | null;
    seriesName: string | null;
    attendanceId: string | null;
    operationType: string;
    operationName: string | null;
    transmittedByName: string | null;
    transmittedByNumbers: number | null;
    situationReport: string | null;
    objectives: Array<{ title: string; description: string; type?: "primary" | "secondary" }> | null;
    deployedForces: Array<{ name: string; optional: boolean }> | null;
    eventNotes: string | null;
}

const OP_TYPE_LABEL: Record<string, string> = {
    Main: "MAIN OPERATION",
    Skirmish: "SKIRMISH",
    Fun: "FUN OP",
    Raid: "RAID",
    Joint: "JOINT OPERATION",
};

const OP_TYPE_COLOR: Record<string, string> = {
    Main: "bg-blue-700",
    Skirmish: "bg-yellow-700",
    Fun: "bg-green-700",
    Raid: "bg-red-800",
    Joint: "bg-purple-800",
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45 },
    },
};

function SectionCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <motion.section
            variants={itemVariants}
            className="rounded-sm border border-[#993534]/20 bg-zinc-900/60 p-6 shadow-[0_0_20px_rgba(153,53,52,0.08)] backdrop-blur-sm"
        >
            <div className="mb-4 flex items-center gap-2.5">
                {icon}
                <h2 className="font-mono text-sm font-bold tracking-[0.25em] text-zinc-300 uppercase">
                    {title}
                </h2>
            </div>
            {children}
        </motion.section>
    );
}

function BriefContent({ data, eventId }: { data: BriefData; eventId: string }) {
    const effectiveOpType = data.operationType ?? "Main";
    const opTypeLabel = OP_TYPE_LABEL[effectiveOpType] ?? effectiveOpType.toUpperCase();
    const opTypeBg = OP_TYPE_COLOR[effectiveOpType] ?? "bg-blue-700";

    const title = data.operationName ?? "OPERATION";
    const formattedDate = format(parseLocalDate(data.eventDate), "dd MMM yyyy").toUpperCase();
    const timeStr = data.eventTime ? `${data.eventTime} EST` : null;

    const hasObjectives = data.objectives && data.objectives.length > 0;
    const hasForces = data.deployedForces && data.deployedForces.length > 0;
    const hasNotes = !!data.eventNotes;

    const showSideGrid = hasForces || hasNotes;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Grid overlay */}
            <div
                className="fixed inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(153,53,52,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(153,53,52,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Scanning line */}
            <motion.div
                className="fixed inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#993534]/15 to-transparent pointer-events-none z-20"
                animate={{ y: ["0vh", "100vh"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Classification banner — top */}
            <div className="bg-[#7a1f1f] py-1.5 text-center sticky top-0 z-10">
                <p className="text-[11px] font-mono font-bold tracking-[0.4em] uppercase text-zinc-100 flex items-center justify-center gap-2">
                    <Shield className="h-3 w-3 shrink-0" />
                    CLASSIFIED — FOR INTERNAL USE ONLY — 9TH ASSAULT CORPS
                    <Shield className="h-3 w-3 shrink-0" />
                </p>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                {/* Back + actions row */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href={`/events`}
                        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Events
                    </Link>
                    <BriefActions eventId={eventId} />
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 border-b border-[#993534]/30 pb-6"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold tracking-widest uppercase text-white ${opTypeBg}`}>
                                    {opTypeLabel}
                                </span>
                                {data.attendanceId && (
                                    <span className="font-mono text-xs text-green-500 tracking-wider border border-green-800 px-2 py-0.5 rounded-sm">
                                        LOGGED
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-zinc-50 uppercase leading-tight mb-2"
                                style={{ textShadow: "0 0 30px rgba(153,53,52,0.2)" }}
                            >
                                {title}
                            </h1>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-xs text-zinc-500">
                                <span>{formattedDate}{timeStr && ` // ${timeStr}`}</span>
                                {data.campaignName && <span>CAMPAIGN: {data.campaignName}</span>}
                                {data.transmittedByName && (
                                    <span>
                                        TRANSMITTED BY: {data.transmittedByNumbers} {data.transmittedByName}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right font-mono text-xs text-[#993534]/60 shrink-0">
                            <div>REF: {eventId.slice(0, 8).toUpperCase()}</div>
                            <div>SEC: CONFIDENTIAL</div>
                        </div>
                    </div>
                </motion.div>

                {/* Sections */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-5"
                >
                    {/* Situation Report */}
                    {data.situationReport && (
                        <SectionCard
                            icon={<AlertTriangle className="h-4 w-4 text-[#993534]" />}
                            title="Situation Report"
                        >
                            {data.situationReport.trimStart().startsWith("<") ? (
                                <div
                                    className="[&_.ProseMirror_p]:text-sm [&_.ProseMirror_li]:text-sm"
                                    style={{ "--editor-font-sans": "var(--editor-font-mono)" } as React.CSSProperties}
                                >
                                    <TiptapEditor value={data.situationReport} editable={false} />
                                </div>
                            ) : (
                                <p className="font-mono text-sm text-zinc-300/90 leading-relaxed whitespace-pre-wrap">
                                    {data.situationReport}
                                </p>
                            )}
                        </SectionCard>
                    )}

                    {/* Objectives */}
                    {hasObjectives && (
                        <SectionCard
                            icon={<Target className="h-4 w-4 text-[#993534]" />}
                            title="Mission Objectives"
                        >
                            <div className="space-y-3">
                                {data.objectives!.map((obj, i) => {
                                    const isSecondary = obj.type === "secondary";
                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-3 rounded-sm border-l-4 p-3 ${
                                                isSecondary
                                                    ? "border-zinc-600 bg-zinc-800/30"
                                                    : "border-[#993534] bg-[#993534]/10"
                                            }`}
                                        >
                                            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-bold ${
                                                isSecondary
                                                    ? "border-zinc-600 text-zinc-500"
                                                    : "border-[#993534] text-[#993534]"
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`font-mono text-[11px] font-bold tracking-widest ${
                                                        isSecondary ? "text-zinc-500" : "text-[#993534]"
                                                    }`}>
                                                        {isSecondary ? "SECONDARY" : "PRIMARY"}
                                                    </span>
                                                </div>
                                                <p className={`font-semibold text-sm ${isSecondary ? "text-zinc-400" : "text-zinc-100"}`}>
                                                    {obj.title}
                                                </p>
                                                {obj.description && (
                                                    <p className={`text-xs mt-1 leading-relaxed ${isSecondary ? "text-zinc-600" : "text-zinc-400"}`}>
                                                        {obj.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>
                    )}

                    {/* Deployed Forces + Command Notes side-by-side (if both exist) */}
                    {showSideGrid && (
                        <div className={`grid gap-5 ${hasForces && hasNotes ? "md:grid-cols-2" : "grid-cols-1"}`}>
                            {hasForces && (() => {
                                const required = data.deployedForces!.filter((f) => !f.optional);
                                const optional = data.deployedForces!.filter((f) => f.optional);
                                return (
                                    <SectionCard
                                        icon={<Users className="h-4 w-4 text-[#993534]" />}
                                        title="Deployed Forces"
                                    >
                                        {required.length > 0 && (
                                            <ul className="space-y-2">
                                                {required.map((force, i) => (
                                                    <li key={i} className="flex items-center gap-2.5 font-mono text-sm text-zinc-300 uppercase">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[#993534] shrink-0" />
                                                        {force.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {optional.length > 0 && (
                                            <div className={required.length > 0 ? "mt-4 pt-4 border-t border-[#993534]/10" : ""}>
                                                <p className="font-mono text-[10px] text-zinc-500 tracking-[0.25em] uppercase mb-2">Optional</p>
                                                <ul className="space-y-2">
                                                    {optional.map((force, i) => (
                                                        <li key={i} className="flex items-center gap-2.5 font-mono text-sm text-zinc-500 uppercase">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0" />
                                                            {force.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </SectionCard>
                                );
                            })()}
                            {hasNotes && (
                                <SectionCard
                                    icon={<FileText className="h-4 w-4 text-[#993534]" />}
                                    title="Command Notes"
                                >
                                    <p className="font-mono text-sm text-zinc-300/90 leading-relaxed whitespace-pre-wrap">
                                        {data.eventNotes}
                                    </p>
                                </SectionCard>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-4 pt-6 border-t border-[#993534]/20 flex items-center justify-between font-mono text-[11px] text-zinc-700"
                    >
                        <span>REF: {eventId.slice(0, 8).toUpperCase()}</span>
                        <span>9TH ASSAULT CORPS // INTERNAL USE ONLY</span>
                    </motion.div>
                </motion.div>
            </div>

            {/* Classification banner — bottom */}
            <div className="bg-[#7a1f1f] py-1.5 text-center mt-4">
                <p className="text-[11px] font-mono font-bold tracking-[0.4em] uppercase text-zinc-100 flex items-center justify-center gap-2">
                    <Shield className="h-3 w-3 shrink-0" />
                    CLASSIFIED — FOR INTERNAL USE ONLY — 9TH ASSAULT CORPS
                    <Shield className="h-3 w-3 shrink-0" />
                </p>
            </div>
        </div>
    );
}

export function BriefDisplay({ data, eventId }: { data: BriefData; eventId: string }) {
    const [loaded, setLoaded] = useState(false);
    const handleComplete = useCallback(() => setLoaded(true), []);

    return (
        <>
            <AnimatePresence>
                {!loaded && <BriefLoadingScreen key="loading" onComplete={handleComplete} />}
            </AnimatePresence>

            {loaded && <BriefContent data={data} eventId={eventId} />}
        </>
    );
}
