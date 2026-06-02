import { getAllBillets } from "@/services/billets";
import { getAllUnitElements } from "@/services/unit-elements";
import { BilletsDragList } from "./_components/billets-drag-list";

export default async function BilletsPage() {
    const [billets, unitElements] = await Promise.all([
        getAllBillets(),
        getAllUnitElements(),
    ]);

    const unitElementOptions = unitElements.map((u) => ({ id: u.id, name: u.name }));

    return <BilletsDragList billets={billets} unitElements={unitElementOptions} />;
}
