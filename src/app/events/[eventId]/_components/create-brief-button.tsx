"use client";

import { useRouter } from "next/navigation";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

interface CreateBriefButtonProps {
    eventId: string;
    seriesOperationType?: string | null;
}

export default function CreateBriefButton({ eventId }: CreateBriefButtonProps) {
    const router = useRouter();
    const { trooperCtx } = useController();

    const canManageBrief = checkPermissionsSync(trooperCtx, [
        "Zeus",
        "Admin",
        RankLevel.Command,
    ]);

    if (!canManageBrief) return null;

    return (
        <Button variant="outline" className="w-full" onClick={() => router.push(`/events/${eventId}/brief/new`)}>
            <FilePlus className="h-4 w-4 mr-2" />
            Create Brief
        </Button>
    );
}
