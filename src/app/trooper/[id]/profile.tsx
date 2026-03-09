"use client";

import { Rank, Status, Trooper } from "@/db/schema";
import Image from "next/image";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import AttendanceHeatmap from "./_components/Heatmap";
import Qualifications from "./_components/qualifications";
import { Badge } from "@/components/ui/badge";

import { useEffect, useState, useTransition } from "react";
import { RankLevel, TrooperProfileBilletResponse } from "@/lib/types";
import ProfileSkeleton from "./_components/ProfileSkeleton";
import { notFound, useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, EllipsisIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogDescription,
    DialogTitle,
    DialogContent,
    DialogFooter,
} from "@/components/ui/dialog";
import DepartmentInformation from "./_components/Departments";
import { ProtectedComponent } from "@/components/protected-component";

const GRADE_ORDER = ["E-1", "E-2", "E-3", "E-4", "E-5", "N-1", "N-2", "O-1", "C-1"] as const;

function parseGradeSegments(grade: string | null | undefined): { filled: number; total: number } {
    const total = GRADE_ORDER.length;
    if (!grade) return { filled: 0, total };
    const idx = GRADE_ORDER.indexOf(grade as typeof GRADE_ORDER[number]);
    return { filled: idx === -1 ? 0 : idx + 1, total };
}

function getTimeInServiceMonths(
    recruitmentDate: string | null | undefined
): number {
    if (!recruitmentDate) return 0;
    const start = new Date(recruitmentDate);
    const now = new Date();
    return Math.max(
        0,
        (now.getFullYear() - start.getFullYear()) * 12 +
            (now.getMonth() - start.getMonth())
    );
}

export default function Profile() {
    const { id }: { id: string } = useParams();
    const [rank, setRank] = useState<Rank>();
    const [billetInformation, setBilletInformation] =
        useState<TrooperProfileBilletResponse>();
    const [trooper, setTrooper] = useState<Trooper>();
    const [attendanceCount, setAttendanceCount] = useState<number>(0);
    const [rankLoading, setRankLoading] = useState(true);
    const [billetLoading, setBilletLoading] = useState(true);
    const [trooperLoading, setTrooperLoading] = useState(true);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [isAccountLinked, setIsAccountLinked] = useState(true);
    const [discordName, setDiscordName] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/v1/trooper?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                setTrooper(data);
                setTrooperLoading(false);
            });
        fetch("/api/v1/rank?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                setRank(data);
                setRankLoading(false);
            });
        fetch("/api/v1/billetInformation?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                setBilletInformation(data.billet);
                setBilletLoading(false);
            });
        fetch("/api/v1/user?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                setIsAccountLinked(data != null);
                setDiscordName(data?.name ?? null);
            });
        fetch("/api/v1/attendanceCount?trooperId=" + id)
            .then((res) => res.json())
            .then((data) => {
                setAttendanceCount(data.attendanceCount);
                setAttendanceLoading(false);
            });
    }, [id]);

    const statusStyle = (status: Status) => {
        if (status === "Active")
            return "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30";
        if (status === "Inactive")
            return "bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30";
        if (status === "Discharged")
            return "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30";
        return "bg-muted text-muted-foreground border border-border";
    };

    if (!trooper && !trooperLoading) notFound();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState<string>("");
    const [isInviteGenerating, setIsInviteGenerating] = useTransition();

    function handleInviteClick() {
        setIsDialogOpen(true);
        setIsInviteGenerating(async () => {
            const response = await fetch("/api/v1/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trooperId: id }),
            });
            if (!response.ok) {
                toast.error("Failed to generate invite link.");
                return;
            }
            const { inviteLink } = await response.json();
            setInviteLink(inviteLink);
        });
    }

    function InviteDialog() {
        const handleCopyToClipboard = () => {
            navigator.clipboard.writeText(inviteLink);
            toast.success("Invite link copied to clipboard!");
        };
        return (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogTitle>Trooper Invite Link</DialogTitle>
                    {isInviteGenerating ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="size-4 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <DialogDescription>
                                Copy the link below and send it to the recruit:
                            </DialogDescription>
                            <ScrollArea className="mt-2 mb-4 p-2 border rounded">
                                <code>{inviteLink}</code>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            <DialogFooter>
                                <Button
                                    onClick={handleCopyToClipboard}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Copy to Clipboard
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        );
    }

    const tis = getTimeInServiceMonths(trooper?.recruitmentDate);

    return (
        <div className="px-4 md:px-8">
            {rankLoading ||
            billetLoading ||
            attendanceLoading ||
            trooperLoading ? (
                <div className="flex justify-center items-center h-full">
                    <ProfileSkeleton />
                </div>
            ) : (
                <div className="flex flex-col min-h-screen gap-4">
                    <ProtectedComponent
                        allowedPermissions={[
                            "Admin",
                            RankLevel.Command,
                            RankLevel.Company,
                            RankLevel.SNCO,
                            RankLevel.JNCO,
                        ]}
                    >
                        {!isAccountLinked && (
                            <Alert variant="default" className="relative">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Heads up!</AlertTitle>
                                <AlertDescription>
                                    <p>
                                        This trooper is not linked to an
                                        account!
                                    </p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="absolute top-4 right-4 z-20"
                                            >
                                                <EllipsisIcon />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem
                                                onSelect={handleInviteClick}
                                            >
                                                Generate Invite Link
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </AlertDescription>
                            </Alert>
                        )}
                    </ProtectedComponent>

                    <div className="w-full grid lg:grid-cols-3 gap-4 align-top">
                        {/* ── LEFT COLUMN ─────────────────────────────── */}
                        <div className="w-auto lg:col-span-1 space-y-4">
                            <Card className="rounded-xl shadow-md overflow-hidden">
                                {/* Card header with grid overlay */}
                                <div className="relative bg-background border-b border-border overflow-hidden">
                                    <div
                                        className="absolute inset-0 opacity-[0.12] dark:opacity-[0.35]"
                                        style={{
                                            backgroundImage:
                                                "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                                            backgroundSize: "48px 48px",
                                            maskImage:
                                                "radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%)",
                                            WebkitMaskImage:
                                                "radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%)",
                                        }}
                                    />
                                    <div className="relative flex flex-col items-center px-6 pt-8 pb-6 gap-3">
                                        <Image
                                            alt="Unit Element Logo"
                                            src={
                                                billetInformation?.unitElement
                                                    ?.icon ??
                                                "/images/9_logo.png"
                                            }
                                            height={140}
                                            width={140}
                                            className="aspect-square object-contain drop-shadow-lg"
                                        />
                                        {/* Billet role · unit element */}
                                        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground text-center">
                                            {billetInformation?.billet?.role ??
                                                "Unbilleted"}
                                            {billetInformation?.unitElement
                                                ?.name
                                                ? ` · ${billetInformation.unitElement.name}`
                                                : ""}
                                        </p>
                                        {/* Name */}
                                        <h4 className="text-2xl lg:text-3xl font-bold text-center leading-tight">
                                            {getFullTrooperName(trooper!)}
                                        </h4>
                                        {/* Rank + rank level */}
                                        <div className="flex items-center gap-2 flex-wrap justify-center">
                                            <span className="text-sm text-muted-foreground font-medium">
                                                {rank?.abbreviation} ·{" "}
                                                {rank?.name}
                                            </span>
                                            <Badge variant="secondary">
                                                {rank?.rankLevel}
                                            </Badge>
                                        </div>
                                        {/* Status pill */}
                                        <div
                                            className={`rounded-full px-5 py-1 text-xs font-semibold ${statusStyle(trooper!.status)}`}
                                        >
                                            {trooper!.status}
                                        </div>

                                        {/* Grade bar */}
                                        {rank?.grade && (() => {
                                            const { filled, total } = parseGradeSegments(rank.grade);
                                            return (
                                                <div className="w-full px-2 pt-2">
                                                    <div className="flex gap-1.5 justify-center">
                                                        {Array.from({ length: total }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                                    i < filled
                                                                        ? "bg-accent9th"
                                                                        : "bg-muted"
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    {/* Bottom accent line */}
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent9th/50" />
                                </div>

                                {/* Stats grid */}
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-2 divide-x divide-y text-center">
                                        <div className="py-4 px-2">
                                            <h5 className="text-base font-bold">
                                                {tis}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                                    mo
                                                </span>
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Time in Service
                                            </p>
                                        </div>
                                        <div className="py-4 px-2">
                                            <h5 className="text-base font-bold">
                                                0
                                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                                    mo
                                                </span>
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Time in Grade
                                            </p>
                                        </div>
                                        <div className="py-4 px-2">
                                            <h5 className="text-sm font-bold leading-snug">
                                                {formatDate(
                                                    trooper!.recruitmentDate ??
                                                        Date.now()
                                                )}
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Enlisted
                                            </p>
                                        </div>
                                        <div className="py-4 px-2">
                                            <h5 className="text-sm font-bold leading-snug">
                                                {billetInformation?.superiorTrooper
                                                    ? getFullTrooperName(
                                                          billetInformation.superiorTrooper
                                                      )
                                                    : "N/A"}
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Direct Superior
                                            </p>
                                        </div>
                                        <div className="py-4 px-2">
                                            <h5 className="text-base font-bold">
                                                {attendanceCount}
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Attendances
                                            </p>
                                        </div>
                                        <div className="py-4 px-2">
                                            <h5 className="text-sm font-bold leading-snug truncate">
                                                {discordName ?? "—"}
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Discord
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <DepartmentInformation trooperId={id} />
                        </div>

                        {/* ── RIGHT COLUMN ────────────────────────────── */}
                        <div className="lg:col-span-2 w-auto space-y-4">
                            <AttendanceHeatmap trooperId={id} />
                            <Qualifications trooperId={id} />
                        </div>
                    </div>
                </div>
            )}
            <InviteDialog />
        </div>
    );
}
