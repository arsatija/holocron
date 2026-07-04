import { getMedals } from "@/services/medals";
import { MedalsTable } from "./_components/medals-table";

export const dynamic = "force-dynamic";

export default async function MedalsPage() {
    const medals = await getMedals();
    return <MedalsTable medals={medals} />;
}
