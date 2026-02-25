"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";

interface DepartmentInformationProps {
    trooperId: string;
}

type DepartmentWithDate = {
    name: string;
    updatedAt: string;
};

export default function DepartmentInformation({
    trooperId,
}: DepartmentInformationProps) {
    const [departments, setDepartments] = useState<DepartmentWithDate[]>([]);
    const [departmentsLoading, setDepartmentsLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/v1/trooperDepartments?trooperId=${trooperId}`)
            .then((res) => res.json())
            .then((data: DepartmentWithDate[]) => {
                if (data.length === 0) {
                    setDepartments([]);
                } else {
                    // Deduplicate by department name, keeping the earliest date
                    const seen = new Map<string, DepartmentWithDate>();
                    for (const dept of data) {
                        if (
                            !seen.has(dept.name) ||
                            dept.updatedAt < seen.get(dept.name)!.updatedAt
                        ) {
                            seen.set(dept.name, dept);
                        }
                    }
                    setDepartments([...seen.values()]);
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
                                    <Tooltip key={department.name}>
                                        <TooltipTrigger asChild>
                                            <div className="bg-zinc-800 text-white shadow-base rounded-lg border h-12 flex justify-center text-center align-middle items-center cursor-help">
                                                {department.name.split(" ")[0]}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                {formatDate(department.updatedAt)}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
