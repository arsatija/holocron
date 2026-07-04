import { getAllUnitElements } from "@/services/unit-elements";
import { UnitElementsTree } from "./_components/unit-elements-tree";

export const dynamic = "force-dynamic";

export default async function UnitElementsPage() {
    const elements = await getAllUnitElements();
    return <UnitElementsTree elements={elements} />;
}
