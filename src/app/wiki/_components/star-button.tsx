"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
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
            } else {
                // Keep the sidebar's Starred section (server-rendered in the
                // layout) in sync with this toggle.
                router.refresh();
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
