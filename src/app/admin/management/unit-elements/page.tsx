import { getAllUnitElements } from "@/services/unit-elements";
import { UnitElementsTree } from "./_components/unit-elements-tree";

export default async function UnitElementsPage() {
    const elements = await getAllUnitElements();
    return <UnitElementsTree elements={elements} />;
}
