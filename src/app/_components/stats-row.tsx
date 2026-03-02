import { Card, CardContent } from "@/components/ui/card";
import { Users, Crosshair, GraduationCap, Clock } from "lucide-react";
import { HomepageStats } from "@/services/homepage";
import { format, differenceInCalendarDays } from "date-fns";
import { parseLocalDate } from "@/lib/utils";

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
                    <div className="max-w-[80%]">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {label}
                        </p>
                        <p className="text-2xl font-bold leading-tight">{value}</p>
                        {sub && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
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

    const date = parseLocalDate(event.eventDate);
    const days = differenceInCalendarDays(date, new Date());

    const subLabel = event.name;
    if (days === 0) return { value: "Today", sub: subLabel};
    if (days === 1) return { value: "Tomorrow", sub: subLabel};
    return { 
        value: `${days}d`, 
        sub: subLabel 
    };
}

export default function StatsRow({ stats }: { stats: HomepageStats }) {
    const nextEventDisplay = formatNextEvent(stats.nextEvent);

    return (
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    icon={Users}
                    label="Active Troopers"
                    value={stats.activeMembers}
                />
                <StatCard
                    icon={Crosshair}
                    label="Deployments Completed"
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
