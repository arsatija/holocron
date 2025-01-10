import { Card } from "@/components/ui/card";
import RecruitmentForm from "./recruitmentForm";
import RecruitmentInfo from "./recruitmentInfo";

export default async function RecruitmentPage() {
    return (
        <div className="min-h-full p-4">
            <Card className="grid grid-cols-2 divide-x">
                <div className="col-span-1 p-4 bg-muted/20 shadow-xl rounded-l-xl">
                    <RecruitmentInfo />
                </div>
                <div className="col-span-1 p-4 rounded-r-xl">
                    <RecruitmentForm />
                </div>
            </Card>
        </div>
    );
}
