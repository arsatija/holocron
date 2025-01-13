"use client";

import CalendarHeatmap from "@/components/CalendarHeatmap";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import HeatmapSkeleton from "./heatmap-skeleton";

export interface AttendanceHeatmapProps {
    trooperId: string;
}

export default function AttendanceHeatmap({
    trooperId,
}: AttendanceHeatmapProps) {
    const [attendanceData, setAttendanceData] = useState<string[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/v1/heatmapAttendances?trooperId=${trooperId}`)
            .then((response) => response.json())
            .then((data) => {
                setAttendanceData(data);
                setAttendanceLoading(false);
            })
            .catch((error) =>
                console.error("Error loading attendance:", error)
            );
    }, []);

    const exampleData = [
        "2025-01-01",
        "2025-01-05",
        "2025-01-10",
        "2025-02-01",
        "2025-03-15",
    ];

    return (
        <Card className="rounded-xl shadow-md ">
            <div className="p-6 relative">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        Attendance
                    </h3>
                </div>
                {attendanceLoading ? (
                    <HeatmapSkeleton />
                ) : (
                    <div className="p-6 pt-0 space-y-4">
                        <CalendarHeatmap
                            year={new Date().getFullYear()}
                            data={attendanceData}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}
