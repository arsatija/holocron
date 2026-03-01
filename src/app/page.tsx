import { Suspense } from "react";

// Homepage has live data (stats, BattleMetrics, announcements) — render at request time
export const dynamic = "force-dynamic";
import HeroBanner from "./_components/hero-banner";
import StatsRow from "./_components/stats-row";
import UpcomingEvents from "./_components/upcoming-events";
import AnnouncementsFeed from "./_components/announcements-feed";
import ServerStatusWidget from "./_components/server-status";
import CurrentCampaigns from "./_components/current-campaigns";
import QuickLinks from "./_components/quick-links";
import { getHomepageStats } from "@/services/homepage";
import { Skeleton } from "@/components/ui/skeleton";

function StatsRowSkeleton() {
    return (
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[88px] rounded-xl" />
                ))}
            </div>
        </div>
    );
}

function CardSkeleton({ className }: { className?: string }) {
    return <Skeleton className={`rounded-xl ${className ?? "h-48"}`} />;
}

async function StatsSection() {
    const stats = await getHomepageStats();
    return <StatsRow stats={stats} />;
}

export default function Home() {
    return (
        <div className="min-h-screen">
            <HeroBanner />

            <div className="py-6 space-y-6">
                {/* Stats row */}
                <Suspense fallback={<StatsRowSkeleton />}>
                    <StatsSection />
                </Suspense>

                {/* Main content — 70/30 */}
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                        {/* Left column */}
                        <div className="space-y-6">
                            <Suspense fallback={<CardSkeleton className="h-72" />}>
                                <UpcomingEvents />
                            </Suspense>
                            <Suspense fallback={<CardSkeleton className="h-64" />}>
                                <AnnouncementsFeed />
                            </Suspense>
                        </div>

                        {/* Right column */}
                        <div className="space-y-4">
                            <ServerStatusWidget />
                            <Suspense fallback={<CardSkeleton className="h-48" />}>
                                <CurrentCampaigns />
                            </Suspense>
                            <QuickLinks />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
