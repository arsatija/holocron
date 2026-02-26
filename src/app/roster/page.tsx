import Table from "./table";
import { type SearchParams } from "@/types";
import CreateTrooperDialog from "./_components/create-trooper";

interface IndexPageProps {
    searchParams: Promise<SearchParams>;
}

export default async function Roster(props: IndexPageProps) {
    let isDialogOpen = false;

    return (
        <div className="container mx-auto py-4 md:py-8">
            <Table searchParams={props.searchParams} />
        </div>
    );
}
