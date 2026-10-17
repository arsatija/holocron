"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Label, Pie, PieChart } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Users,
    UserPlus,
    ShieldCheck,
    Medal,
    Star,
    BarChart2,
    CalendarDays,
    TrendingUp,
} from "lucide-react";

type TrooperRef = { name: string; numbers: number; status: string };

type RecruitmentStats = {
    summary: {
        totalActive: number;
        totalInactive: number;
        totalDischarged: number;
        totalEver: number;
        thisMonth: number;
        thisYear: number;
        retentionRate: number;
    };
    referralMethods: { method: string; count: number }[];
    topRecruiters: {
        id: string;
        name: string;
        numbers: number;
        count: number;
        recruits: TrooperRef[];
    }[];
    topReferrers: {
        id: string;
        name: string;
        numbers: number;
        count: number;
        referred: TrooperRef[];
    }[];
    monthlyTrend: { month: string; count: number; recruits: TrooperRef[] }[];
};

const REFERRAL_LABELS: Record<string, string> = {
    reddit: "Reddit",
    referral: "In-Unit Referral",
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    "unit-page": "Unit Page",
    returning: "Returning Member",
    unknown: "Unknown",
};

const REFERRAL_COLORS: Record<string, string> = {
    reddit: "#f97316",
    referral: "#993534",
    youtube: "#dc2626",
    tiktok: "#ec4899",
    instagram: "#a855f7",
    "unit-page": "#3b82f6",
    returning: "#10b981",
    unknown: "#6b7280",
};

function formatMonth(yyyyMM: string): string {
    const [year, month] = yyyyMM.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const STATUS_COLOR: Record<string, string> = {
    Active: "text-green-400",
    Inactive: "text-yellow-400",
    Discharged: "text-red-400",
    Retired: "text-pink-400",
};

function TrooperList({ items }: { items: TrooperRef[] }) {
    if (items.length === 0) return <p className="italic opacity-60">None recorded</p>;
    return (
        <ul className="space-y-0.5 max-h-48 overflow-y-scroll">
            {items.map((t) => (
                <li key={t.numbers} className={cn("font-mono", STATUS_COLOR[t.status] ?? "")}>
                    {t.numbers} &ldquo;{t.name}&rdquo;
                </li>
            ))}
        </ul>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    sub?: string;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-3xl font-extrabold mt-1">{value}</p>
                        {sub && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {sub}
                            </p>
                        )}
                    </div>
                    <div className="p-2 rounded-md bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SkeletonCard() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}

function ReferralDonutCard({
    loading,
    referralMethods,
}: {
    loading: boolean;
    referralMethods: { method: string; count: number }[];
}) {
    const sorted = useMemo(
        () => [...referralMethods].sort((a, b) => b.count - a.count),
        [referralMethods],
    );

    const total = useMemo(
        () => sorted.reduce((s, r) => s + r.count, 0),
        [sorted],
    );

    const chartConfig = useMemo<ChartConfig>(() => {
        const cfg: ChartConfig = { count: { label: "Troopers" } };
        for (const r of sorted) {
            cfg[r.method] = {
                label: REFERRAL_LABELS[r.method] ?? r.method,
                color: REFERRAL_COLORS[r.method] ?? "#6b7280",
            };
        }
        return cfg;
    }, [sorted]);

    const chartData = useMemo(
        () =>
            sorted.map((r) => ({
                method: r.method,
                count: r.count,
                fill: REFERRAL_COLORS[r.method] ?? "#6b7280",
            })),
        [sorted],
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="h-4 w-4" />
                    Referral Method Breakdown
                </CardTitle>
                <CardDescription>
                    How current active troopers found the unit
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                {loading ? (
                    <div className="mx-auto aspect-square max-h-[350px] flex items-center justify-center">
                        <Skeleton className="h-[300px] w-[300px] rounded-full" />
                    </div>
                ) : sorted.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                        No referral data recorded yet.
                    </p>
                ) : (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[350px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel inverted />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="method"
                                innerRadius={80}
                                strokeWidth={5}
                            >
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-3xl font-bold"
                                                    >
                                                        {total.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy ?? 0) + 24}
                                                        className="fill-muted-foreground"
                                                    >
                                                        Troopers
                                                    </tspan>
                                                </text>
                                            );
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}

export default function MediaPage() {
    const [stats, setStats] = useState<RecruitmentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/v1/recruitment-stats")
            .then((r) => {
                if (!r.ok) throw new Error("Failed to load stats");
                return r.json();
            })
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch((e) => {
                setError(e.message);
                setLoading(false);
            });
    }, []);

    const totalReferrals =
        stats?.referralMethods.reduce((sum, r) => sum + r.count, 0) ?? 0;
    const maxTrend = stats
        ? Math.max(...stats.monthlyTrend.map((m) => m.count), 1)
        : 1;
    const maxRecruiter = stats?.topRecruiters[0]?.count ?? 1;
    const maxReferrer = stats?.topReferrers[0]?.count ?? 1;

    return (
        <TooltipProvider delayDuration={150}>
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
                    <div className="relative container mx-auto px-4 py-10 text-center">
                        <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                            9th Assault Corps
                        </p>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#993534]">
                            Media Dashboard
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Recruitment analytics and sourcing breakdown
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8 space-y-8">
                    {error && (
                        <Card className="border-destructive">
                            <CardContent className="pt-6 text-destructive text-sm">
                                Failed to load recruitment stats: {error}
                            </CardContent>
                        </Card>
                    )}

                    {/* Summary stat cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {loading ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : (
                            <>
                                <StatCard
                                    icon={Users}
                                    label="Total Active"
                                    value={stats?.summary.totalActive ?? 0}
                                    sub={`${stats?.summary.totalInactive ?? 0} inactive`}
                                />
                                <StatCard
                                    icon={UserPlus}
                                    label="Recruited This Month"
                                    value={stats?.summary.thisMonth ?? 0}
                                />
                                <StatCard
                                    icon={CalendarDays}
                                    label="Recruited This Year"
                                    value={stats?.summary.thisYear ?? 0}
                                />
                                <StatCard
                                    icon={ShieldCheck}
                                    label="Retention Rate"
                                    value={`${stats?.summary.retentionRate ?? 0}%`}
                                    sub={`${stats?.summary.totalDischarged ?? 0} discharged`}
                                />
                            </>
                        )}
                    </div>

                    {/* Monthly trend + Referral methods */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="h-4 w-4" />
                                    Monthly Recruitment (Last 12 Months)
                                </CardTitle>
                                <CardDescription>
                                    Hover a bar to see who was recruited
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <Skeleton key={i} className="h-8 w-full" />
                                        ))}
                                    </div>
                                ) : stats?.monthlyTrend.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No data yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {stats?.monthlyTrend.map((m) => (
                                            <div
                                                key={m.month}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="text-xs text-muted-foreground w-28 shrink-0">
                                                    {formatMonth(m.month)}
                                                </span>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex-1 h-6 bg-muted rounded overflow-hidden cursor-default">
                                                            <div
                                                                className="h-full bg-[#993534] rounded transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.max(4, Math.round((m.count / maxTrend) * 100))}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        className="max-w-[220px] p-3"
                                                        side="top"
                                                    >
                                                        <p className="font-semibold mb-1.5">
                                                            {formatMonth(m.month)} — {m.count} recruit{m.count !== 1 ? "s" : ""}
                                                        </p>
                                                        <TrooperList items={m.recruits} />
                                                    </TooltipContent>
                                                </Tooltip>
                                                <span className="text-xs font-semibold w-5 text-right shrink-0">
                                                    {m.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Referral method breakdown */}
                        <ReferralDonutCard
                            loading={loading}
                            referralMethods={stats?.referralMethods ?? []}
                        />
                    </div>

                    {/* Top recruiters + top referrers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top recruiters */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Medal className="h-4 w-4" />
                                    Top Recruiters
                                </CardTitle>
                                <CardDescription>
                                    Hover a bar to see who they recruited
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-10 w-full" />
                                        ))}
                                    </div>
                                ) : stats?.topRecruiters.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No recruiter data yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {stats!.topRecruiters.map((r, i) => (
                                            <div
                                                key={r.id}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="text-xs text-muted-foreground w-5 text-right shrink-0 font-mono">
                                                    #{i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium truncate">
                                                            {r.numbers} &ldquo;{r.name}&rdquo;
                                                        </span>
                                                        <Badge variant="secondary" className="ml-2 shrink-0">
                                                            {r.count}
                                                        </Badge>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden cursor-default">
                                                                <div
                                                                    className="h-full bg-[#993534] rounded-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${Math.max(4, Math.round((r.count / maxRecruiter) * 100))}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            className="max-w-[220px] p-3"
                                                            side="top"
                                                        >
                                                            <p className="font-semibold mb-1.5">
                                                                Recruited by {r.numbers} &ldquo;{r.name}&rdquo;
                                                            </p>
                                                            <TrooperList items={r.recruits} />
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top referrers */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Star className="h-4 w-4" />
                                    Top Referrers
                                </CardTitle>
                                <CardDescription>
                                    Hover a bar to see who they referred
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-10 w-full" />
                                        ))}
                                    </div>
                                ) : stats?.topReferrers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No referral data yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {stats!.topReferrers.map((r, i) => (
                                            <div
                                                key={r.id}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="text-xs text-muted-foreground w-5 text-right shrink-0 font-mono">
                                                    #{i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium truncate">
                                                            {r.numbers} &ldquo;{r.name}&rdquo;
                                                        </span>
                                                        <Badge variant="secondary" className="ml-2 shrink-0">
                                                            {r.count}
                                                        </Badge>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden cursor-default">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${Math.max(4, Math.round((r.count / maxReferrer) * 100))}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            className="max-w-[220px] p-3"
                                                            side="top"
                                                        >
                                                            <p className="font-semibold mb-1.5">
                                                                Referred by {r.numbers} &ldquo;{r.name}&rdquo;
                                                            </p>
                                                            <TrooperList items={r.referred} />
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
