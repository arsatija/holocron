"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Users, Map } from "lucide-react";
import { ServerStatus } from "@/app/api/v1/server-status/route";
import { formatDistanceToNow } from "date-fns";

function StatusDot({ online }: { online: boolean }) {
    return (
        <span
            className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                online ? "bg-green-500" : "bg-red-500"
            }`}
        />
    );
}

export default function ServerStatusWidget() {
    const [servers, setServers] = useState<ServerStatus[]>([]);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/server-status")
            .then((r) => r.json())
            .then((data) => {
                setServers(data.servers ?? []);
                setFetchedAt(data.fetchedAt ? new Date(data.fetchedAt) : new Date());
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Server Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <>
                        {[0, 1].map((i) => (
                            <div
                                key={i}
                                className="animate-pulse space-y-2 rounded-md border border-border p-3"
                            >
                                <div className="h-3 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        ))}
                    </>
                ) : servers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Unable to reach BattleMetrics.
                    </p>
                ) : (
                    <>
                    {servers.map((s) => {
                        const online = s.status === "online";
                        return (
                            <div
                                key={s.id}
                                className="rounded-md border border-border p-3 space-y-2"
                            >
                                {/* Top row: dot + name + player count */}
                                <div className="flex items-center gap-2">
                                    <StatusDot online={online} />
                                    <span className="text-sm font-medium truncate flex-1">
                                        {s.name}
                                    </span>
                                    {online && (
                                        <span className="text-sm font-semibold tabular-nums text-muted-foreground shrink-0 flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {s.playerCount}/{s.maxPlayers}
                                        </span>
                                    )}
                                    {!online && (
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            Offline
                                        </span>
                                    )}
                                </div>

                                {/* Bottom row: map + mission file */}
                                {online && (s.currentMap || s.currentMission) && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-4 min-w-0">
                                        <Map className="h-3 w-3 shrink-0" />
                                        <span className="font-mono truncate">
                                            {[s.currentMap, s.currentMission]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {fetchedAt && (
                        <p className="text-xs text-muted-foreground text-right pt-1">
                            Updated {formatDistanceToNow(fetchedAt, { addSuffix: true })}
                        </p>
                    )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
