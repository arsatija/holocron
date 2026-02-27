import { getBilletChainOrbat } from "./_lib/queries";
import OrbatChartLoader from "./_components/OrbatChartLoader";

export default async function OrbatPage() {
    const data = await getBilletChainOrbat();
    return <OrbatChartLoader data={data} />;
}
