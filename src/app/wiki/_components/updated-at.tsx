"use client";

import { differenceInHours, format, formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UpdatedAtProps {
    date: string;
    name: string | null;
}

// Relative ("5 minutes ago") under 12 hours old, otherwise an absolute date —
// either way the label is underlined and hoverable for the exact timestamp.
export function UpdatedAt({ date, name }: UpdatedAtProps) {
    const parsed = new Date(date);
    const hoursAgo = differenceInHours(new Date(), parsed);
    const label =
        hoursAgo < 12
            ? formatDistanceToNow(parsed, { addSuffix: true })
            : format(parsed, "MMM d, yyyy");

    return (
        <p className="text-sm text-muted-foreground mt-1">
            Updated{" "}
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="underline decoration-dotted underline-offset-2 cursor-default">
                        {label}
                    </span>
                </TooltipTrigger>
                <TooltipContent>{format(parsed, "MMM d, yyyy 'at' h:mm a")}</TooltipContent>
            </Tooltip>
            {name && <> by {name}</>}
        </p>
    );
}
