import { getRanks } from "@/services/ranks";
import { RanksTable } from "./_components/ranks-table";

export default async function RanksPage() {
    const ranks = await getRanks();
    return <RanksTable ranks={ranks} />;
}
