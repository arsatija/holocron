import Table from "./table";
import { type SearchParams } from "@/types";

interface IndexPageProps {
    searchParams: Promise<SearchParams>;
}

export default async function Roster(props: IndexPageProps) {
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
                <div className="relative container mx-auto px-4 py-10 md:py-14 text-center">
                    <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                        9th Assault Corps
                    </p>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#993534]">
                        Roster
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Active members of the 9th Assault Corps.
                    </p>
                </div>
            </div>

            <div className="container mx-auto py-4 md:py-8">
                <Table searchParams={props.searchParams} />
            </div>
        </div>
    );
}
