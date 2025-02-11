import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleOverflowProps {
    values: string[];
}

export default function CollapsibleOverflow({
    values,
}: CollapsibleOverflowProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {values.slice(0, 3).map((trainee) => (
                <Badge key={trainee} variant="outline">
                    {trainee}
                </Badge>
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
                    <Badge key={trainee} variant="outline">
                        {trainee}
                    </Badge>
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
