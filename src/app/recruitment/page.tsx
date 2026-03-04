"use client";

import { Card } from "@/components/ui/card";
import RecruitmentForm from "./recruitmentForm";
import RecruitmentInfo, {
    RecruitmentChecklistState,
} from "./recruitmentInfo";
import { useMemo, useState } from "react";

const initialChecklist: RecruitmentChecklistState = {
    legalCopyOfArma3: false,
    unitIsEst: false,
    wikiLinkShared: false,
    pathToCtExplained: false,
    howToAttendOpsExplained: false,
    correctDiscordFormatting: false,
    discordTagsGiven: false,
    teamspeakTagsGiven: false,
    joinedArmaUnit: false,
    joinedSteamGroup: false,
    holocronExplained: false,
};

export default function RecruitmentPage() {
    const [checklist, setChecklist] =
        useState<RecruitmentChecklistState>(initialChecklist);

    const allChecklistComplete = useMemo(
        () => Object.values(checklist).every(Boolean),
        [checklist]
    );

    return (
        <div className="min-h-full p-4">
            <Card className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                <div className="p-4 bg-muted/20 shadow-xl rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                    <RecruitmentInfo
                        checklist={checklist}
                        onChecklistChange={setChecklist}
                    />
                </div>
                <div className="p-4 rounded-b-xl md:rounded-r-xl md:rounded-bl-none">
                    <RecruitmentForm canSubmit={allChecklistComplete} />
                </div>
            </Card>
        </div>
    );
}
