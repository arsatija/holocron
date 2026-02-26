import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Fireworks } from "@fireworks-js/react";

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

const UNIT_CREATION_DATE = "2024-12-16";
const UNIT_CREATION_DATE_OBJ = new Date(2024, 11, 16);

type CalendarHeatmapProps = {
    year: number;
    data: string[];
};

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ year, data }) => {
    const calendarData = generateCalendarData(year);

    return (
        <div className="flex flex-wrap gap-1">
            {calendarData.map((date) => {
                const formattedDate = formatDate(date, "yyyy-MM-dd");

                const isBeforeCreation = date < UNIT_CREATION_DATE_OBJ;
                const isCreationDate = formattedDate === UNIT_CREATION_DATE;
                const isAttendance = data.includes(formattedDate);

                if (isBeforeCreation) {
                    return <div key={formattedDate} className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-zinc-900" />;
                }

                return (
                    <div key={formattedDate}>
                        {isCreationDate ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-4 h-4 rounded-sm bg-accent9th cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="relative overflow-hidden">
                                    <Fireworks
                                        options={{
                                            rocketsPoint: { min: 0, max: 100 },
                                            hue: { min: 0, max: 360 },
                                            delay: { min: 30, max: 60 },
                                            decay: { min: 0.015, max: 0.03 },
                                            intensity: 30,
                                            explosion: 4,
                                            particles: 40,
                                            traceLength: 2,
                                            flickering: 50,
                                            brightness: { min: 50, max: 80 },
                                        }}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            pointerEvents: "none",
                                        }}
                                    />
                                    <p className="relative z-10">
                                        Unit Created - {formatDate(date, "PPP")}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        ) : isAttendance ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-4 h-4 rounded-sm bg-green-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{formatDate(date, "PPP")}</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <div className="w-4 h-4 rounded-sm bg-slate-200 dark:bg-zinc-800" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CalendarHeatmap;
