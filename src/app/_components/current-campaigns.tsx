import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, Crosshair } from "lucide-react";
import Link from "next/link";
import { getActiveCampaigns } from "@/services/homepage";

export default async function CurrentCampaigns() {
    const campaigns = await getActiveCampaigns();

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Active Campaigns
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No active campaigns.
                    </p>
                ) : (
                    campaigns.map((c) => {
                        const planned = c.plannedOperationCount ?? 0;
                        const done = c.operationCount ?? 0;
                        const pct = planned > 0 ? Math.round((done / planned) * 100) : 0;

                        return (
                            <div
                                key={c.id}
                                className="rounded-lg border border-border p-3 space-y-3"
                            >
                                {/* Name + badge */}
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-bold leading-tight">
                                        {c.name}
                                    </p>
                                    <Badge variant="default" className="shrink-0 text-xs">
                                        Active
                                    </Badge>
                                </div>

                                {/* Description */}
                                {c.description && (
                                    <p className="text-xs text-muted-foreground leading-snug line-clamp-1">
                                        {c.description}
                                    </p>
                                )}

                                {/* Missions progress */}
                                {planned > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Crosshair className="h-3 w-3" />
                                                Missions: {done}/{planned}
                                            </span>
                                            <span className="font-medium text-foreground">{pct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-foreground transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* View button */}
                                <Link href={`/campaigns/${c.id}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full text-xs">
                                        View Campaign
                                    </Button>
                                </Link>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
