import { db } from "../../db";
import { troopers } from "../../db/schema";

export async function fetchPlayers() {
  try {
    const result = await db.select().from(troopers);

    return result;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest players.");
  }
}
