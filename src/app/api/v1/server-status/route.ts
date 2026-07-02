import { NextResponse } from "next/server";

export const runtime = "edge";

export interface ServerStatus {
    id: string;
    name: string;
    status: "online" | "offline";
    playerCount: number;
    maxPlayers: number;
    currentMap: string | null;
    currentMission: string | null;
}

const BM_BASE = "https://api.battlemetrics.com/servers";

const server_ids = ["38446452", "38461469", "38462769"];

async function fetchServer(id: string): Promise<ServerStatus> {
    const res = await fetch(`${BM_BASE}/${id}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        console.error(
            `Failed to fetch server status for ${id}: ${res.statusText}`,
        );
        return {
            id,
            name: "Unknown",
            status: "offline",
            playerCount: 0,
            maxPlayers: 0,
            currentMap: null,
            currentMission: null,
        };
    }

    const json = await res.json();
    const attr = json.data?.attributes ?? {};

    return {
        id,
        name: attr.name ?? "Unknown",
        status: attr.status === "online" ? "online" : "offline",
        playerCount: attr.players ?? 0,
        maxPlayers: attr.maxPlayers ?? 0,
        currentMap: attr.details?.map ?? null,
        currentMission: attr.details?.mission ?? null,
    };
}

export async function GET() {
    const results = await Promise.allSettled(server_ids.map(fetchServer));

    const servers: ServerStatus[] = results.map((r, i) =>
        r.status === "fulfilled"
            ? r.value
            : {
                  id: server_ids[i],
                  name: "Unknown",
                  status: "offline" as const,
                  playerCount: 0,
                  maxPlayers: 0,
                  currentMap: null,
                  currentMission: null,
              },
    );

    return NextResponse.json(
        { servers, fetchedAt: new Date().toISOString() },
        {
            headers: {
                "Cache-Control":
                    "public, s-maxage=60, stale-while-revalidate=120",
            },
        },
    );
}
