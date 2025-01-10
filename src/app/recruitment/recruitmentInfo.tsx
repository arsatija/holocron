import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function RecruitmentInfo() {
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
                <div className="text-sm mt-1 grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>Legal Copy of Arma 3?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>Unit is based on EST</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>Pass on the wiki's Link</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>How to get to CT</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>How to attend operations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>Correct Discord formatting?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>Discord Tags?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox />
                        <Label>Teamspeak Tags?</Label>
                    </div>
                </div>
            </div>
        </div>
    );
}
