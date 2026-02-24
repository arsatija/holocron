"use client";

import CalendarHeatmap from "@/components/CalendarHeatmap";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import HeatmapSkeleton from "./heatmap-skeleton";

export interface AttendanceHeatmapProps {
    trooperId: string;
}

export default function AttendanceHeatmap({
    trooperId,
}: AttendanceHeatmapProps) {
    const [attendanceData, setAttendanceData] = useState<string[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

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
                <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        Attendance
                    </h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setYear((y) => y + 1)}
                            className="p-0.5 rounded hover:bg-muted"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium tabular-nums w-12 text-center">
                            {year}
                        </span>
                        <button
                            onClick={() => setYear((y) => Math.max(2024, y - 1))}
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                            disabled={year <= 2024}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                {attendanceLoading ? (
                    <HeatmapSkeleton />
                ) : (
                    <div className="p-6 pt-0 space-y-4">
                        <CalendarHeatmap
                            year={year}
                            data={attendanceData}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}
