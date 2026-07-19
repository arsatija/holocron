import Link from "next/link";
import { Search } from "lucide-react";
import { getWikiSearchResults } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function WikiSearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q } = await searchParams;
    const query = q?.trim() ?? "";
    const results = query ? await getWikiSearchResults(query) : [];

    return (
        <div className="h-full overflow-y-auto">
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Search</h1>
                {query && (
                    <p className="text-muted-foreground text-sm">
                        {results.length} result{results.length !== 1 ? "s" : ""} for
                        &ldquo;{query}&rdquo;
                    </p>
                )}
            </div>

            {!query ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                    <Search className="h-8 w-8" />
                    <p className="text-sm">Use the search box in the sidebar (or Ctrl+K) to search wiki pages.</p>
                </div>
            ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No pages found for &ldquo;{query}&rdquo;.
                </p>
            ) : (
                <ul className="space-y-4">
                    {results.map((result) => (
                        <li key={result.id} className="border-b pb-4 last:border-b-0">
                            <Link
                                href={`/wiki/${result.collectionSlug}/${result.id}`}
                                className="text-base font-medium hover:underline"
                            >
                                {result.title}
                            </Link>
                            <p
                                className="text-sm text-muted-foreground mt-1 [&_b]:text-foreground [&_b]:font-semibold"
                                dangerouslySetInnerHTML={{ __html: result.snippet }}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
        </div>
    );
}
