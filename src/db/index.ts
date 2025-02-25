// import { drizzle } from "drizzle-orm/neon-serverless";
// import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "dotenv";
import * as schema from "./schema";

config({ path: ".env.local" }); // or .env.local

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(pool, { schema });
