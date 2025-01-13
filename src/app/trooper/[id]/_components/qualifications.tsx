"use client";

import { qualifications } from "@/lib/definitions";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PlayerQualificationsResponse } from "@/lib/types";
import { getPlayerQualifications } from "../queries";
import { useEffect, useState } from "react";
import QualificationSkeleton from "./qualification-skeleton";

// temporary to help type
// const playerQualifications: playerQualificationsResponse[] = [
//     {
//         qualificationId: 3,
//         earnedDate: "2025-01-01",
//     },
//     {
//         qualificationId: 9,
//         earnedDate: "2025-01-04",
//     },
//     {
//         qualificationId: 10,
//         earnedDate: "2025-01-07",
//     },
// ];

export default function Qualifications({ trooperId }: { trooperId: string }) {
    const qualsTruthTable: { [key: number]: boolean } = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
        10: false,
        11: false,
        12: false,
        13: false,
        14: false,
        15: false,
        16: false,
        17: false,
        18: false,
        19: false,
        20: false,
    };

    const [playerQualifications, setPlayerQualifications] = useState<
        {
            qualificationId: string;
            earnedDate: string;
        }[]
    >([]);

    const [qualifications, setQualifications] = useState<
        {
            id: string;
            name: string;
            abbreviation: string;
        }[]
    >([]);

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
    }, [trooperId]); // Added trooperId as dependency

    return (
        <Card className="rounded-xl shadow-md ">
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
                    <div className="p-6 pt-0 space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            {qualifications.map((qualification) => {
                                const playerQual = playerQualifications.find(
                                    (qual) =>
                                        qual.qualificationId ===
                                        qualification.id
                                );
                                return (
                                    <div key={qualification.id}>
                                        {playerQual ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="bg-green-400 text-black shadow-base rounded-lg border text-card-foreground h-12 flex justify-center text-center align-middle items-center cursor-help">
                                                        {qualification.name}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        {formatDate(
                                                            playerQual.earnedDate
                                                        )}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <div className="border-red-400 shadow-base rounded-lg border text-card-foreground h-12 flex justify-center text-center align-middle items-center">
                                                {qualification.name}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
