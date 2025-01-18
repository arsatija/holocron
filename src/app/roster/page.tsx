import Table from "./table";
import { type SearchParams } from "@/types";
import CreateTrooperDialog from "./_components/create-trooper";

interface IndexPageProps {
    searchParams: Promise<SearchParams>;
}

export default async function Roster(props: IndexPageProps) {
    let isDialogOpen = false;

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-end relative">
                <CreateTrooperDialog />
            </div>
            <Table searchParams={props.searchParams} />
        </div>
    );
}
