import { Card } from "@/components/ui/card";
import RecruitmentForm from "./recruitmentForm";
import RecruitmentInfo from "./recruitmentInfo";

export default async function RecruitmentPage() {
    return (
        <div className="min-h-full p-4">
            <Card className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                <div className="p-4 bg-muted/20 shadow-xl rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                    <RecruitmentInfo />
                </div>
                <div className="p-4 rounded-b-xl md:rounded-r-xl md:rounded-bl-none">
                    <RecruitmentForm />
                </div>
            </Card>
        </div>
    );
}
