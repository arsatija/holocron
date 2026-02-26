"use client";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import QualificationSkeleton from "./qualification-skeleton";

type Qualification = {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
};

type PlayerQualification = {
    qualificationId: string;
    earnedDate: string;
    trainingId: string | null;
};

const CATEGORY_ORDER = [
    "Standard",
    "Medical",
    "Advanced",
    "Aviation",
    "Detachments",
    "Leadership",
] as const;

export default function Qualifications({ trooperId }: { trooperId: string }) {
    const [playerQualifications, setPlayerQualifications] = useState<
        PlayerQualification[]
    >([]);

    const [qualifications, setQualifications] = useState<Qualification[]>([]);

    const [isLoading, setIsLoading] = useState({
        qualificationsList: true,
        playerQualifications: true,
    });

    useEffect(() => {
        fetch("/api/v1/qualificationList")
            .then((response) => response.json())
            .then((data) => {
                setQualifications(data);
                setIsLoading((prev) => ({
                    ...prev,
                    qualificationsList: false,
                }));
            })
            .catch((error) =>
                console.error("Error loading qualifications:", error)
            );

        fetch(`/api/v1/trooperQualifications?trooperId=${trooperId}`)
            .then((response) => response.json())
            .then((data) => {
                setPlayerQualifications(data);
                setIsLoading((prev) => ({
                    ...prev,
                    playerQualifications: false,
                }));
            })
            .catch((error) =>
                console.error("Error loading trooper qualifications:", error)
            );
    }, [trooperId]);

    const grouped = qualifications.reduce<Record<string, Qualification[]>>(
        (acc, qual) => {
            (acc[qual.category] ??= []).push(qual);
            return acc;
        },
        {}
    );

    return (
        <Card className="rounded-xl shadow-md">
            <div className="p-6 relative">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        Qualifications
                    </h3>
                </div>
                {isLoading.qualificationsList &&
                isLoading.playerQualifications ? (
                    <QualificationSkeleton />
                ) : (
                    <div className="p-6 pt-0 space-y-6">
                        {CATEGORY_ORDER.filter(
                            (cat) => grouped[cat]?.length
                        ).map((category) => (
                            <div key={category}>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                    {category}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                                    {grouped[category].map((qualification) => {
                                        const playerQual =
                                            playerQualifications.find(
                                                (qual) =>
                                                    qual.qualificationId ===
                                                    qualification.id
                                            );
                                        return (
                                            <div key={qualification.id}>
                                                {playerQual ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            {playerQual.trainingId ? (
                                                                <a
                                                                    href={`/qualifications/${qualification.id}/training/${playerQual.trainingId}`}
                                                                    className="bg-green-400 text-black shadow-base rounded-lg border text-card-foreground h-12 flex justify-center text-center align-middle items-center cursor-pointer hover:bg-green-300 transition-colors px-1"
                                                                >
                                                                    <span className="sm:hidden text-xs font-medium leading-tight">
                                                                        {qualification.abbreviation}
                                                                    </span>
                                                                    <span className="hidden sm:block text-sm leading-tight">
                                                                        {qualification.name}
                                                                    </span>
                                                                </a>
                                                            ) : (
                                                                <div className="bg-green-400 text-black shadow-base rounded-lg border text-card-foreground h-12 flex justify-center text-center align-middle items-center cursor-help px-1">
                                                                    <span className="sm:hidden text-xs font-medium leading-tight">
                                                                        {qualification.abbreviation}
                                                                    </span>
                                                                    <span className="hidden sm:block text-sm leading-tight">
                                                                        {qualification.name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-medium">{qualification.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDate(
                                                                    playerQual.earnedDate
                                                                )}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <div className="border-red-400 bg-slate-50 dark:bg-zinc-900 shadow-base rounded-lg border text-card-foreground h-12 flex justify-center text-center align-middle items-center px-1">
                                                        <span className="sm:hidden text-xs font-medium leading-tight">
                                                            {qualification.abbreviation}
                                                        </span>
                                                        <span className="hidden sm:block text-sm leading-tight">
                                                            {qualification.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
