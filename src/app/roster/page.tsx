"use server";

import { DataTable } from "@/components/data-table";
import { fetchPlayers } from "@/lib/data/player";
import { playersColumns } from "./columns";

export default async function Roster() {

  const playersData = await fetchPlayers();

  return (
  <div className="container mx-auto py-8">
    <DataTable columns={playersColumns} data={playersData} />
  </div>
  );
}
