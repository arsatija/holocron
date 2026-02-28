import { getOrbat, getDepartmentOrbat } from "./_lib/queries";
import OrbatTabs from "./_components/OrbatTabs";

export default async function OrbatPage() {
    const [billetsData, departmentsData] = await Promise.all([
        getOrbat(),
        getDepartmentOrbat(),
    ]);
    return <OrbatTabs billetsData={billetsData} departmentsData={departmentsData} />;
}
