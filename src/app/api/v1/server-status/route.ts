import { Server } from "@fabricio-191/valve-server-query";
import { NextResponse } from "next/server";

export interface ServerStatus {
    id: string;
    name: string;
    status: "online" | "offline";
    playerCount: number;
    maxPlayers: number;
    currentMap: string | null;
    currentMission: string | null;
}

const SERVERS = [
    { id: "2302", port: 2303 },
    { id: "2312", port: 2313 },
    { id: "2342", port: 2343 },
];

const SERVER_IP = "74.91.123.29";

const lastKnown = new Map<string, ServerStatus>();

async function fetchServer(id: string, port: number): Promise<ServerStatus> {
    try {
        const server = await Server({ ip: SERVER_IP, port, timeout: 3000 });
        const info = await server.getInfo();
        server.disconnect();

        const result: ServerStatus = {
            id,
            name: info.name,
            status: "online",
            playerCount: info.players.online,
            maxPlayers: info.players.max,
            currentMap: info.game ?? null,
            currentMission: null,
        };

        lastKnown.set(id, result);
        return result;
    } catch {
        const cached = lastKnown.get(id);
        if (cached) {
            return {
                ...cached,
                status: "offline",
                playerCount: 0,
                maxPlayers: 0,
                currentMap: null,
            };
        }
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
}

export async function GET() {
    const servers = await Promise.all(
        SERVERS.map((s) => fetchServer(s.id, s.port)),
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
