declare module "@fabricio-191/valve-server-query" {
    interface ValveServerOptions {
        ip?: string;
        port?: number;
        timeout?: number;
        debug?: boolean;
        enableWarns?: boolean;
        retries?: number;
    }

    interface ValveServerInfo {
        address: string;
        ping: number;
        protocol: number;
        goldSource: boolean;
        name: string;
        map: string;
        folder: string;
        game: string;
        appID: number | bigint;
        players: {
            online: number;
            max: number;
            bots: number;
        };
        type: "dedicated" | "non-dedicated" | "source tv relay" | null;
        OS: "linux" | "windows" | "mac";
        visibility: "private" | "public";
        VAC: boolean;
        version?: string;
        port?: number;
        steamID?: bigint;
        keywords?: string[];
        gameID?: bigint;
    }

    interface ValveServerPlayerInfo {
        index: number;
        name: string;
        score: number;
        timeOnline: { hours: number; minutes: number; seconds: number; start: Date; raw: number } | null;
        deaths?: number;
        money?: number;
    }

    interface ValveServerInstance {
        getInfo(): Promise<ValveServerInfo>;
        getPlayers(): Promise<ValveServerPlayerInfo[]>;
        getRules(): Promise<Record<string, string | boolean | number>>;
        ping(): Promise<number>;
        disconnect(): void;
        lastPing: number;
    }

    export function Server(data?: ValveServerOptions): Promise<ValveServerInstance>;
}
