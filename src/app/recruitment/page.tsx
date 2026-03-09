import { Card } from "@/components/ui/card";
import RecruitmentForm from "./recruitmentForm";
import RecruitmentInfo from "./recruitmentInfo";

export default async function RecruitmentPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="relative w-full bg-background border-b border-border overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.12] dark:opacity-[0.35]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                        maskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                    }}
                />
                <div className="relative container mx-auto px-4 py-10 text-center">
                    <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                        9th Assault Corps
                    </p>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#993534]">
                        Recruitment
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Card className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                    <div className="p-4 bg-muted/20 shadow-xl rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                        <RecruitmentInfo />
                    </div>
                    <div className="p-4 rounded-b-xl md:rounded-r-xl md:rounded-bl-none">
                        <RecruitmentForm />
                    </div>
                </Card>
            </div>
        </div>
    );
}
