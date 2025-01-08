import Table from "./table";
import { searchParamsCache } from "@/_lib/validations"
import { type SearchParams } from "@/types"
interface IndexPageProps {
  searchParams: Promise<SearchParams>
}

export default async function Roster(props: IndexPageProps) {

  return (
    <div className="container mx-auto py-8">
      <Table searchParams={props.searchParams} />
    </div>
  );
}
