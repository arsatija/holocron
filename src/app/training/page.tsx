import { Suspense } from "react";
import { type SearchParams } from "@/types";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import TrainingCompletionForm from "./_components/training-completion-form";
import TrainingsTableContainer from "./trainings-table-container";

interface IndexPageProps {
    searchParams: Promise<SearchParams>;
}

export default async function TrainingPage(props: IndexPageProps) {
    return (
        <div className="h-full flex-1 flex-col container mx-auto space-y-8 p-4 md:p-8 md:flex">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Training History
                        </h2>
                        <p className="text-muted-foreground">
                            View all training sessions
                        </p>
                    </div>
                </div>
                <TrainingsTableContainer searchParams={props.searchParams} />
            </div>
        </div>
    );
}
