import { drizzle } from "drizzle-orm/neon-serverless";
import { neon, Pool } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

config({ path: ".env.local" }); // or .env.local

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(pool, { schema });

const test = await db.select();

const billets = alias(schema.billets, "billets");
const superiorBillets = alias(schema.billets, "superior_billets");
const superiorPlayers = alias(schema.players, "superior_players");
const superiorAssignments = alias(
    schema.billetAssignments,
    "superior_assignment"
);

const result = await db
    .select({
        billet: billets,
        superior_billet: superiorBillets,
        superior_trooper: superiorPlayers,
    })
    .from(schema.billetAssignments)
    .innerJoin(billets, eq(schema.billetAssignments.billetId, billets.id))
    .innerJoin(
        schema.players,
        eq(schema.billetAssignments.trooperId, schema.players.id)
    )
    .leftJoin(superiorBillets, eq(billets.superiorBilletId, superiorBillets.id))
    .leftJoin(
        superiorAssignments,
        eq(superiorBillets.id, superiorAssignments.billetId)
    )
    .leftJoin(
        superiorPlayers,
        eq(superiorAssignments.trooperId, superiorPlayers.id)
    )
    .where(eq(schema.players.id, "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b"));

// .innerJoin(schema.billetAssignments, eq(schema.billet))
//     .on(schema.billets.superiorBilletId.equals(schema.billetAssignments.as('superior_assignment').billetId))
// .leftJoin(schema.players.as('superior_players'))
//     .on(schema.billetAssignments.as('superior_assignment').trooperId.equals(schema.players.as('superior_players').id))
// .where(schema.billetAssignments.trooperId.equals(playerId)); // filter by playerId

console.log(result);
