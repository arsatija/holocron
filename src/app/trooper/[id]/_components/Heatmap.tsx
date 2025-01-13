import CalendarHeatmap from "@/components/CalendarHeatmap";
import { Card } from "@/components/ui/card";

export default function AttendanceHeatmap() {
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
                <div className="p-6 pt-0 space-y-4">
                    <CalendarHeatmap
                        year={new Date().getFullYear()}
                        data={exampleData}
                    />
                </div>
            </div>
        </Card>
    );
}
