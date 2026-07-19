"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleStarAction } from "../_lib/actions";

export function StarButton({
    pageId,
    initialStarred,
}: {
    pageId: string;
    initialStarred: boolean;
}) {
    const [starred, setStarred] = useState(initialStarred);
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        const next = !starred;
        setStarred(next); // optimistic
        startTransition(async () => {
            const result = await toggleStarAction(pageId);
            if (result && "error" in result) {
                setStarred(!next);
                toast.error(result.error);
            }
        });
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleClick}
            disabled={isPending}
        >
            <Star
                className={cn(
                    "h-4 w-4 mr-1.5",
                    starred && "fill-yellow-400 text-yellow-400"
                )}
            />
            {starred ? "Starred" : "Star"}
        </Button>
    );
}
