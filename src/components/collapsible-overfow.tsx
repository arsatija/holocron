import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { redirect } from "next/navigation";

interface CollapsibleOverflowProps {
    values: Record<string, string>[];
}

export default function CollapsibleOverflow({
    values,
}: CollapsibleOverflowProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {values.slice(0, 3).map((trainee) => (
                <a key={trainee.id} href={`/trooper/${trainee.id}`}>
                    <Badge
                        variant="outline"
                        className="hover:cursor-pointer hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
                    >
                        {trainee.name}
                    </Badge>
                </a>
            ))}

            {values.length > 3 && !isOpen && (
                <CollapsibleTrigger asChild>
                    <div className="flex flex-wrap gap-1 pt-2 hover:cursor-pointer hover:underline items-center">
                        Show More
                        <ChevronDown className="size-4" />
                    </div>
                </CollapsibleTrigger>
            )}
            <CollapsibleContent>
                {values.slice(3).map((trainee) => (
                    <a key={trainee.id} href={`/trooper/${trainee.id}`}>
                        <Badge
                            variant="outline"
                            className="hover:cursor-pointer hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
                        >
                            {trainee.name}
                        </Badge>
                    </a>
                ))}
            </CollapsibleContent>
            {values.length > 3 && isOpen && (
                <CollapsibleTrigger asChild>
                    <div className="flex flex-wrap gap-1 pt-2 hover:cursor-pointer hover:underline items-center">
                        Show Less
                        <ChevronUp className="size-4" />
                    </div>
                </CollapsibleTrigger>
            )}
        </Collapsible>
    );
}
