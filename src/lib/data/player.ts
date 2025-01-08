import { db } from "../../db";
import { players } from "../../db/schema";

export async function fetchPlayers() {
  try {
    const result = await db.select().from(players);

    return result;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest players.");
  }
}
