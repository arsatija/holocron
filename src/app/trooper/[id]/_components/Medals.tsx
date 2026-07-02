"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProtectedComponent } from "@/components/protected-component";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { RankLevel } from "@/lib/types";

interface Medal {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string;
}

interface AwardedMedal {
    id: string;
    medalId: string;
    awardedDate: string;
    medal: Medal;
}

interface MedalsProps {
    trooperId: string;
}

export default function Medals({ trooperId }: MedalsProps) {
    const [awarded, setAwarded] = useState<AwardedMedal[]>([]);
    const [allMedals, setAllMedals] = useState<Medal[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/v1/trooperMedals?trooperId=${trooperId}`)
            .then((r) => r.json())
            .then((data: AwardedMedal[]) => {
                setAwarded(data);
                setLoading(false);
            });
    }, [trooperId]);

    function enterEdit() {
        fetch("/api/v1/medals")
            .then((r) => r.json())
            .then((data: Medal[]) => {
                setAllMedals(data);
                setEditing(true);
            });
    }

    async function handleMedalClick(medal: Medal) {
        const isAwarded = awarded.some((a) => a.medalId === medal.id);
        setBusy(medal.id);

        if (isAwarded) {
            const res = await fetch("/api/v1/trooperMedals", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trooperId, medalId: medal.id }),
            });
            if (res.ok) {
                setAwarded((prev) => prev.filter((a) => a.medalId !== medal.id));
            } else {
                toast.error("Failed to revoke medal.");
            }
        } else {
            const res = await fetch("/api/v1/trooperMedals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trooperId, medalId: medal.id }),
            });
            if (res.ok) {
                const row: AwardedMedal = await res.json();
                setAwarded((prev) => [...prev, { ...row, medal }]);
            } else {
                toast.error("Failed to award medal.");
            }
        }

        setBusy(null);
    }

    if (loading) {
        return (
            <Card className="rounded-xl shadow-md border-[#993534]/20">
                <div className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-[3/1] rounded-md" />
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    const displayMedals = (editing ? allMedals : awarded.map((a) => a.medal))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Card className="rounded-xl shadow-md border-[#993534]/20">
            <div className="p-6 relative">
                <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        <span className="text-accent9th mr-1">//</span>Medals
                    </h3>
                    <ProtectedComponent
                        allowedPermissions={[RankLevel.Command]}
                    >
                        {editing ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditing(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={enterEdit}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </ProtectedComponent>
                </div>
                <div className="">
                    {!editing && displayMedals.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic p-6 pt-0">
                            No medals awarded.
                        </p>
                    ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {displayMedals.map((medal) => {
                            const isAwarded = awarded.some((a) => a.medalId === medal.id);
                            const awardRecord = awarded.find((a) => a.medalId === medal.id);
                            const isBusy = busy === medal.id;

                            return (
                                <Tooltip key={medal.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={editing ? () => handleMedalClick(medal) : undefined}
                                            disabled={isBusy}
                                            className={`relative aspect-[3/1] w-full rounded-md overflow-hidden transition-all ${
                                                editing ? "cursor-pointer hover:ring-2 hover:ring-accent9th" : "cursor-default"
                                            } ${
                                                editing && !isAwarded ? "opacity-30" : "opacity-100"
                                            } ${isBusy ? "opacity-50" : ""}`}
                                        >
                                            <Image
                                                src={medal.imageUrl}
                                                alt={medal.name}
                                                fill
                                                className="object-contain p-1"
                                            />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-medium">{medal.name}</p>
                                        {medal.description && (
                                            <p className="text-muted-foreground text-xs max-w-48">{medal.description}</p>
                                        )}
                                        {awardRecord && (
                                            <p className="text-muted-foreground text-xs mt-1">
                                                Awarded {formatDate(awardRecord.awardedDate)}
                                            </p>
                                        )}
                                        {editing && !isAwarded && (
                                            <p className="text-xs text-green-600 italic">Click to award</p>
                                        )}
                                        {editing && isAwarded && (
                                            <p className="text-xs text-destructive italic">Click to revoke</p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
