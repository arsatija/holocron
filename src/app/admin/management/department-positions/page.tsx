import { getAllDepartmentPositions, getAllDepartments } from "@/services/departments";
import { PositionsDragList } from "./_components/positions-drag-list";

export default async function DepartmentPositionsPage() {
    const [positions, departments] = await Promise.all([
        getAllDepartmentPositions(),
        getAllDepartments(),
    ]);

    const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }));

    return <PositionsDragList positions={positions} departments={deptOptions} />;
}
