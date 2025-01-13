import { notFound } from "next/navigation";
import { getRank, getTrooper } from "./queries";
import { getBilletInformation } from "@/services/billets";
import { Status } from "@/db/schema";
import Image from "next/image";
import { formatDate, getFullTrooperName } from "@/lib/utils";
import DepartmentInformation from "./_components/departments";
import { Card } from "@/components/ui/card";
import AttendanceHeatmap from "./_components/Heatmap";
import Qualifications from "./_components/qualifications";
import { Badge } from "@/components/ui/badge";
import { fallbackRank } from "@/lib/fallbacks";

interface ProfileParams {
    id: string;
}

export default async function Profile({ id }: ProfileParams) {
    const [trooper, billetInformation] = await Promise.all([
        getTrooper(id),
        getBilletInformation(id),
    ]);
    if (!trooper) {
        notFound();
    }
    const rank = (await getRank(trooper.rank)) ?? fallbackRank;

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
                                        src={
                                            billetInformation?.unitElement
                                                ? billetInformation.unitElement
                                                      .icon
                                                : "/images/9_logo.png"
                                        }
                                        height={225}
                                        width={225}
                                        className="aspect-square w-36 object-contain h-auto"
                                    />
                                    <h4 className="text-3xl lg:text-4xl font-bold text-center pt-6">
                                        {getFullTrooperName(trooper)}
                                    </h4>
                                    <div className="text-lg text-muted-foreground py-2">
                                        {billetInformation?.unitElement.name
                                            ? billetInformation.unitElement.name
                                            : "Unbilleted"}{" "}
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
                                            {billetInformation?.superiorTrooper
                                                ? getFullTrooperName(
                                                      billetInformation.superiorTrooper
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
                    <DepartmentInformation trooperId={id} />
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 w-auto space-y-4">
                    <AttendanceHeatmap trooperId={id} />
                    <Qualifications trooperId={id} />
                </div>
            </div>
        </div>
    );
}
