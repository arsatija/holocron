import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import WebSocket from "ws";
import { config } from "dotenv";
import * as schema from "./schema";


if (process.env.NODE_ENV === "production") {
    config({ path: ".env.prod", override: true });

    neonConfig.webSocketConstructor = WebSocket;
    neonConfig.poolQueryViaFetch = true;
} else if (process.env.NODE_ENV === "development") {
    config({ path: ".env.local", override: true });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
