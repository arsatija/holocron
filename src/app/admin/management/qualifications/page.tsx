import { getQualificationOptions } from "@/services/qualifications";
import { QualificationsTable } from "./_components/qualifications-table";

export const dynamic = "force-dynamic";

export default async function QualificationsPage() {
    const qualifications = await getQualificationOptions();
    return <QualificationsTable qualifications={qualifications} />;
}
