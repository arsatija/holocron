"use client";

import { Card } from "@/components/ui/card";

interface DepartmentInformationProps {
    trooperId: string;
}

export default function DepartmentInformation({
    trooperId,
}: DepartmentInformationProps) {
    const departments = ["Admin", "Training", "Mod", "Zeus"];

    return (
        <Card className="rounded-xl shadow-md ">
            <div className="p-6 relative">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        Departments
                    </h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {departments.map((department) => {
                            return (
                                <div
                                    key={department}
                                    className="bg-zinc-800 text-white shadow-base rounded-lg border h-12 flex justify-center text-center align-middle items-center"
                                >
                                    {department}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
}
