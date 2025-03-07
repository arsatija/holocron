import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";

// Helper function to generate calendar data
const generateCalendarData = (year: number) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const dates = [];

    while (startDate <= endDate) {
        dates.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
    }

    return dates;
};

type CalendarHeatmapProps = {
    year: number;
    data: string[]; // Example: { "2025-01-01": true, "2025-01-02": false }
};

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ year, data }) => {
    const calendarData = generateCalendarData(year);

    return (
        <div className="flex flex-wrap gap-1">
            {calendarData.map((date) => {
                const formattedDate = formatDate(date, "yyyy-MM-dd");

                return (
                    <div key={formattedDate}>
                        {data.includes(formattedDate) ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-4 h-4 rounded-sm bg-green-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{formatDate(formattedDate, "PPP")}</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <div className="w-4 h-4 rounded-sm bg-zinc-800" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CalendarHeatmap;
