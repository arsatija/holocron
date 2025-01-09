import { qualifications } from "@/lib/definitions";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { playerQualificationsResponse } from "@/lib/types";
import { getPlayerQualifications } from "../queries";

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

export default async function Qualifications({
    trooperId,
}: {
    trooperId: string;
}) {
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

    const playerQualifications = await getPlayerQualifications(trooperId);

    const toggleQualifications = (
        playerQualifications: playerQualificationsResponse[]
    ) => {
        playerQualifications.forEach((qual: playerQualificationsResponse) => {
            qualsTruthTable[qual.qualificationId] = true;
        });
    };

    toggleQualifications(playerQualifications);

    return (
        <Card className="rounded-xl shadow-md ">
            <div className="p-6 relative">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-lg font-bold leading-none tracking-tight">
                        Qualifications
                    </h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        {Object.entries(qualsTruthTable).map(([key, value]) => (
                            <div key={key}>
                                {value ? (
                                    <Tooltip>
                                        <TooltipTrigger key={key} asChild>
                                            <div
                                                key={key}
                                                className="bg-green-400 shadow-base rounded-lg border text-card-foreground h-12 flex justify-center text-center align-middle items-center cursor-help"
                                            >
                                                {
                                                    qualifications[Number(key)]
                                                        .name
                                                }
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                {formatDate(
                                                    playerQualifications.find(
                                                        (qual) =>
                                                            qual.qualificationId ===
                                                            Number(key)
                                                    )?.earnedDate ?? Date.now()
                                                )}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <div
                                        key={key}
                                        className="border-red-400 shadow-base rounded-lg border text-card-foreground h-12 flex justify-center text-center align-middle items-center"
                                    >
                                        {qualifications[Number(key)].name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
