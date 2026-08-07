import { getMedicAttendances } from "@/services/medic-attendances";
import { MedicAttendanceTable } from "./medic-attendance-table";

export default async function MedicAttendanceTableContainer() {
    const records = await getMedicAttendances();
    return <MedicAttendanceTable records={records} />;
}