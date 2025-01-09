import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Player, Rank, Status, RankLevel } from "@/db/schema";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import Image from "next/image";
import Qualifications from "../trooper/[id]/_components/qualifications";
import AttendanceHeatmap from "../trooper/[id]/_components/Heatmap";

import { TrooperProfileBilletResponse } from "@/lib/types";
// import { createContext } from "react";
import { getTrooper } from "../trooper/[id]/queries";

import DepartmentInformation from "../trooper/[id]/_components/Departments";

// const PlayerContext = createContext<Player | undefined>(undefined);

export default function Builder() {
    const trooperId = "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b";

    // const trooperData = await getTrooper(trooperId);

    const trooperProfileBillet: TrooperProfileBilletResponse = {
        billet: {
            id: "fa69c8ef-5add-4bf2-9ea2-fb5b1f8cd2a7",
            name: "Team Leader",
            icon: "/images/9_logo.png",
            team: "Cinder 1-1",
            superiorBilletId: "eee40759-6d17-42b2-8e5e-bbe068c556c0",
        },
        superiorBillet: {
            id: "eee40759-6d17-42b2-8e5e-bbe068c556c0",
            name: "Squad Leader",
            icon: "/images/9_logo.png",
            team: "Cinder 1",
            superiorBilletId: null,
        },
        superiorTrooper: {
            id: "a461b0ed-0123-4d8b-b35f-4078a13b2ca4",
            status: "Inactive",
            rank: 2,
            numbers: 2206,
            name: "Lindow",
            referredBy: null,
            recruitmentDate: "2025-01-08",
            attendances: 0,
        },
    };

    const trooper: Player = {
        id: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
        status: "Active",
        rank: 1,
        numbers: 6666,
        name: "Rav",
        referredBy: null,
        recruitmentDate: "2024-12-04",
        attendances: 0,
    };

    const billetInformation = {
        icon: "/images/9_logo.png",
        team: "Cinder HQ",
        superiorBilletId: "Myth HQ",
        superiorPlayerId: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
    };

    const rank: Rank = {
        id: 8,
        grade: "N-2",
        name: "Clone Sergeant",
        abbreviation: "CS",
        rankLevel: "SNCO",
        nextRankId: 4,
    };

    const statusColor = (status: Status) => {
        if (status == "Active") return "bg-green-400";
        else if (status == "Inactive") return "bg-orange-400";
        else if (status == "Discharged") return "bg-red-400";
        else return "bg-muted";
    };

    return (
        <div className="min-h-full py-4 px-8">
            <div className="w-full grid lg:grid-cols-3 gap-4 align-top">
                {/* Left column */}
                <div className="w-auto lg:col-span-1 space-y-4">
                    <Card className="rounded-xl shadow-md">
                        <div className="space-y-12">
                            <div className="p-6 relative">
                                <div className="flex flex-col items-center">
                                    <Image
                                        alt="Billet Logo"
                                        src="/images/9_logo.png"
                                        height={225}
                                        width={225}
                                        className="aspect-square w-36 object-contain h-auto"
                                    />
                                    <h4 className="text-3xl lg:text-4xl font-bold text-center pt-6">
                                        {getFullTrooperName(trooper)}
                                    </h4>
                                    <div className="text-lg text-muted-foreground py-2">
                                        {billetInformation.team}{" "}
                                        <Badge variant={"secondary"}>
                                            {rank.rankLevel}
                                        </Badge>
                                    </div>
                                    <div
                                        className={`rounded-xl w-1/4 h-8 flex mt-6 items-center justify-center ${statusColor(
                                            trooper.status
                                        )}`}
                                    >
                                        {trooper.status}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 divide-x text-center mt-10">
                                    <div>
                                        <h5 className="text-lg font-semibold">
                                            {formatDate(
                                                new Date(
                                                    trooper.recruitmentDate ??
                                                        Date.now()
                                                )
                                            )}
                                        </h5>
                                        <div className="text-sm text-muted-foreground">
                                            Recruitment Date
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="text-lg font-semibold">
                                            {trooperProfileBillet.superiorTrooper
                                                ? getFullTrooperName(
                                                      trooperProfileBillet.superiorTrooper
                                                  )
                                                : "N/A"}
                                        </h5>
                                        <div className="text-sm text-muted-foreground">
                                            Direct Superior
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="text-lg font-semibold">
                                            {trooper.attendances}
                                        </h5>
                                        <div className="text-sm text-muted-foreground">
                                            Attendances
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                    {/* <DepartmentInformation /> */}
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 w-auto space-y-4">
                    <AttendanceHeatmap />
                    {/* <Qualifications /> */}
                </div>
            </div>
        </div>
    );
}
