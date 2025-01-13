"use client";

import { Card } from "@/components/ui/card";

interface DepartmentInformationProps {
    trooperId: string;
}

export default function DepartmentInformation({
    trooperId,
}: DepartmentInformationProps) {
    return (
        <Card className="rounded-xl shadow-md ">
            <div className="p-6 relative">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        Departments
                    </h3>
                </div>
                <div className="p-6 pt-0 space-y-4">{trooperId}</div>
            </div>
        </Card>
    );
}
