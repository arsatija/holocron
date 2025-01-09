"use server";

import { Card } from "@/components/ui/card";
import { getBilletInformation } from "../queries";
import { TrooperProfileBilletResponse } from "@/lib/types";

export default async function DepartmentInformation({
    billetInformation,
}: {
    billetInformation: TrooperProfileBilletResponse | null;
}) {
    // const trooperId = "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b";

    // const billetInformation = await getBilletInformation(trooperId);

    return (
        <Card className="rounded-xl shadow-md ">
            <div className="p-6 relative">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        Departments
                    </h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                    {JSON.stringify(billetInformation)}
                </div>
            </div>
        </Card>
    );
}
