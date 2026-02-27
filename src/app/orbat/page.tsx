import { getBilletChainOrbat, getDepartmentOrbat } from "./_lib/queries";
import OrbatChartLoader from "./_components/OrbatChartLoader";

export default async function OrbatPage() {
    const [data, departmentData] = await Promise.all([
        getBilletChainOrbat(),
        getDepartmentOrbat(),
    ]);
    return <OrbatChartLoader data={data} departmentData={departmentData} />;
}
