import { SearchParams } from "@/types";
import OperationsTableContainer from "../operations-table-container";

interface IndexPageProps {
    searchParams: Promise<SearchParams>;
}

export default function OperationsPage(props: IndexPageProps) {
    return (
        <div className="h-full flex-1 flex-col container mx-auto space-y-8 p-8 md:flex">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Operations
                        </h2>
                        <p className="text-muted-foreground">
                            View all operations
                        </p>
                    </div>
                </div>
                <OperationsTableContainer searchParams={props.searchParams} />
            </div>
        </div>
    );
}
