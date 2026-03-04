import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type RecruitmentChecklistState = {
    legalCopyOfArma3: boolean;
    unitIsEst: boolean;
    wikiLinkShared: boolean;
    pathToCtExplained: boolean;
    howToAttendOpsExplained: boolean;
    correctDiscordFormatting: boolean;
    discordTagsGiven: boolean;
    teamspeakTagsGiven: boolean;
    joinedArmaUnit: boolean;
    joinedSteamGroup: boolean;
    holocronExplained: boolean;
};

type RecruitmentInfoProps = {
    checklist: RecruitmentChecklistState;
    onChecklistChange: (next: RecruitmentChecklistState) => void;
};

export default function RecruitmentInfo({
    checklist,
    onChecklistChange,
}: RecruitmentInfoProps) {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-extrabold">
                    Recruitment Information
                </h2>
                <p className="text-sm text-muted-foreground">
                    Ensure that all fields are filled out correctly as this
                    automatically updates the Unit Roster.
                </p>
            </div>

            <div>
                <h5 className="text-md font-bold">NAMES</h5>
                <ul className="text-sm pl-4">
                    <li className="list-disc">
                        Ensure before filing out form that the Recruit has read
                        the Rules and Regulations on the Member's Wiki
                    </li>

                    <li className="list-disc">
                        Names shouldn't be lore names from Star-Wars or other
                        well-known media
                    </li>
                    <li className="list-disc">Names MUST be 1 word</li>
                    <li className="list-disc">
                        Numbers cannot be duplicates of any currently existing
                        member's numbers
                    </li>
                    <li className="list-disc">
                        Numbers must be 4 Digits (Examples: 1000-9999)
                    </li>
                    <li className="list-disc">
                        Recruiters should ensure that names are professional!
                    </li>
                    <li className="list-disc">
                        No swearing or profanity is allowed within a member's
                        name.
                    </li>
                </ul>
            </div>

            <div>
                <h5 className="text-md font-bold">RANKS</h5>
                <ul className="text-sm pl-4">
                    <li className="list-disc">
                        New Recruits transferring from another Star-sim may
                        apply to receive the rank of Clone Trooper (CT) or
                        Senior Clone Trooper (SCT).
                    </li>
                    <li className="list-disc">
                        If a member is wishing to transfer from an existing
                        Star-sim they must first either get permission from
                        their current unit to join another Star-sim or discharge
                        from their other unit before joining the 9th Assault
                        Corps.
                    </li>
                </ul>
            </div>
            <div>
                <h5 className="text-md font-bold">Recruiter Rules</h5>
                <ul className="text-sm pl-4">
                    <li className="list-disc">
                        Recruiters cannot be the one to Recruit someone they
                        recommended the Unit to.
                    </li>
                    <li className="list-disc">
                        Recruiters MUST ensure the form has been filled out
                        properly.
                    </li>
                    <li className="list-disc">
                        Recruiters should ensure that new recruits have gotten
                        appropriate Discord and Teamspeak Tags.
                    </li>
                </ul>
            </div>
            <div>
                <h5 className="text-md font-bold">Recruiter Checklist</h5>
                <div className="text-sm mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.legalCopyOfArma3}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    legalCopyOfArma3: !!checked,
                                })
                            }
                        />
                        <Label>Legal Copy of Arma 3?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.unitIsEst}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    unitIsEst: !!checked,
                                })
                            }
                        />
                        <Label>Unit is based on EST</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.wikiLinkShared}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    wikiLinkShared: !!checked,
                                })
                            }
                        />
                        <Label>Pass on the <a href="https://wiki.9thac.com" target="_blank" className="text-blue-500 underline">wiki's link</a></Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.pathToCtExplained}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    pathToCtExplained: !!checked,
                                })
                            }
                        />
                        <Label>How to get to CT</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.howToAttendOpsExplained}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    howToAttendOpsExplained: !!checked,
                                })
                            }
                        />
                        <Label>How to attend operations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.correctDiscordFormatting}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    correctDiscordFormatting: !!checked,
                                })
                            }
                        />
                        <Label>Correct Discord formatting?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.discordTagsGiven}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    discordTagsGiven: !!checked,
                                })
                            }
                        />
                        <Label>Discord Tags?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.teamspeakTagsGiven}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    teamspeakTagsGiven: !!checked,
                                })
                            }
                        />
                        <Label>Teamspeak Tags?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.holocronExplained}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    holocronExplained: !!checked,
                                })
                            }
                        />
                        <Label>Holocron explained?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.joinedArmaUnit}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    joinedArmaUnit: !!checked,
                                })
                            }
                        />
                        <Label>Have the recruit join the <a href="https://units.arma3.com/unit/9ac" target="_blank" className="text-blue-500 underline">Arma 3 Unit</a></Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={checklist.joinedSteamGroup}
                            onCheckedChange={(checked) =>
                                onChecklistChange({
                                    ...checklist,
                                    joinedSteamGroup: !!checked,
                                })
                            }
                        />
                        <Label>Have the recruit join the <a href="https://steamcommunity.com/groups/9thMythCompany" target="_blank" className="text-blue-500 underline">Steam Group</a></Label>
                    </div>
                </div>
            </div>
        </div>
    );
}
