import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.prod", override: true });

console.log(process.env.DATABASE_URL);
export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./migrations",
    dialect: "postgresql",
    entities: {
        roles: {
            provider: "neon",
        },
    },
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
