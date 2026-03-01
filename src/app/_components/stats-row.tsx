import { Card, CardContent } from "@/components/ui/card";
import { Users, Crosshair, GraduationCap, Clock } from "lucide-react";
import { HomepageStats } from "@/services/homepage";
import { format, parseISO, differenceInDays } from "date-fns";

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
}) {
    return (
        <Card className="flex-1">
            <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {label}
                        </p>
                        <p className="text-2xl font-bold leading-tight">{value}</p>
                        {sub && (
                            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function formatNextEvent(
    event: HomepageStats["nextEvent"]
): { value: string; sub: string } {
    if (!event) return { value: "—", sub: "None scheduled" };

    const date = parseISO(event.eventDate);
    const days = differenceInDays(date, new Date());
    const dateLabel = format(date, "MMM d");
    const timeLabel = event.eventTime ? ` · ${event.eventTime} UTC` : "";

    if (days === 0) return { value: "Today", sub: `${event.name}${timeLabel}` };
    if (days === 1) return { value: "Tomorrow", sub: `${event.name}${timeLabel}` };
    return { value: `${days}d`, sub: `${event.name} · ${dateLabel}${timeLabel}` };
}

export default function StatsRow({ stats }: { stats: HomepageStats }) {
    const nextEventDisplay = formatNextEvent(stats.nextEvent);

    return (
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    icon={Users}
                    label="Active Members"
                    value={stats.activeMembers}
                />
                <StatCard
                    icon={Crosshair}
                    label="Operations Ran"
                    value={stats.operationsRun}
                />
                <StatCard
                    icon={GraduationCap}
                    label="Trainings Ran"
                    value={stats.trainingsRun}
                />
                <StatCard
                    icon={Clock}
                    label="Next Event"
                    value={nextEventDisplay.value}
                    sub={nextEventDisplay.sub}
                />
            </div>
        </div>
    );
}
