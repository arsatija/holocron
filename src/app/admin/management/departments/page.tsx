import { getAllDepartments } from "@/services/departments";
import { DepartmentsTree } from "./_components/departments-tree";

export default async function DepartmentsPage() {
    const departments = await getAllDepartments();
    return <DepartmentsTree departments={departments.map((d) => ({
        ...d,
        departmentScopes: d.departmentScopes as string[],
    }))} />;
}
