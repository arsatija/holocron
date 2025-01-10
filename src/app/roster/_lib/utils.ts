import { troopers, type Trooper } from "@/db/schema"

/**
 * Returns the appropriate status color based on the provided status.
 * @param status - The status of the Player.
 * @returns A className based off the status.
 */
export function getStatusColor(status: Trooper["status"]) {
  const statusColors = {
    Active: "text-green-400",
    Inactive: "text-orange-400",
    Discharged: "text-red-400"
  }

  return statusColors[status]
}