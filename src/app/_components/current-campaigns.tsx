import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
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
            <CardContent className="space-y-0">
                {campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No active campaigns.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {campaigns.map((c) => (
                            <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {c.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Since{" "}
                                            {format(parseISO(c.startDate), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                    <Badge variant="default" className="shrink-0 text-xs">
                                        Active
                                    </Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="pt-3 border-t border-border mt-1">
                    <Link
                        href="/campaigns"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        View all campaigns →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
