import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import WebSocket from "ws";
import { config } from "dotenv";
import * as schema from "./schema";

config({ path: ".env.local", override: true });

if (process.env.NODE_ENV === "production") {
    neonConfig.webSocketConstructor = WebSocket;
    neonConfig.poolQueryViaFetch = true;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
