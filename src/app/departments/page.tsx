import Orbat from "@/app/orbat/orbat";
import { getDepartmentOrbat } from "@/app/orbat/_lib/queries";

export default async function DepartmentsPage() {
    const departmentsData = await getDepartmentOrbat();
    return (
        <div className="space-y-8 py-4">
            <Orbat data={departmentsData} type="departments" />
        </div>
    );
}
