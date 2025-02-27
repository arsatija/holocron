"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Department } from "@/db/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentInformationProps {
    trooperId: string;
}

export default function DepartmentInformation({
    trooperId,
}: DepartmentInformationProps) {
    const [departments, setDepartments] = useState<string[]>([]);
    const [departmentsLoading, setDepartmentsLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/v1/trooperDepartments?trooperId=${trooperId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.length == 0) {
                    setDepartments([]);
                } else {
                    data = data.map((dept: Department) => dept.name);
                    data = [...new Set(data)];
                    setDepartments(data);
                }
                setDepartmentsLoading(false);
            });
    }, []);

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
                        {departmentsLoading ? (
                            <Skeleton className="w-1/4 h-12" />
                        ) : (
                            departments.map((department) => {
                                return (
                                    <div
                                        key={department}
                                        className="bg-zinc-800 text-white shadow-base rounded-lg border h-12 flex justify-center text-center align-middle items-center"
                                    >
                                        {department.split(" ")[0]}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
