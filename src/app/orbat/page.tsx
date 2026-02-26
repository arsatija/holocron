import { getOrbat } from "./_lib/queries";
import OrbatChartLoader from "./_components/OrbatChartLoader";

export default async function OrbatPage() {
    const billetsData = await getOrbat();
    return <OrbatChartLoader data={billetsData} />;
}
