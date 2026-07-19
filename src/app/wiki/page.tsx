import Link from "next/link";
import { getWikiHomeData } from "./_lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WikiHomePage() {
    const { collections, starred, recent } = await getWikiHomeData();
    const slugById = new Map(collections.map((c) => [c.id, c.slug]));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Wiki</h1>
                <p className="text-muted-foreground text-sm">
                    Browse collections or search for a page.
                </p>
            </div>

            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Collections
                </h2>
                {collections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No collections yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collections.map((collection) => (
                            <Link key={collection.id} href={`/wiki/${collection.slug}`}>
                                <Card className="h-full transition-colors hover:bg-accent/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span>{collection.icon || "📄"}</span>
                                            {collection.name}
                                        </CardTitle>
                                    </CardHeader>
                                    {collection.description && (
                                        <CardContent className="text-sm text-muted-foreground line-clamp-2">
                                            {collection.description}
                                        </CardContent>
                                    )}
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        <Star className="h-3.5 w-3.5" />
                        Starred
                    </h2>
                    {starred.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Star pages to pin them here.
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {starred.map((page) => {
                                const slug = slugById.get(page.collectionId);
                                if (!slug) return null;
                                return (
                                    <li key={page.pageId}>
                                        <Link
                                            href={`/wiki/${slug}/${page.pageId}`}
                                            className="text-sm hover:underline"
                                        >
                                            {page.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        <Clock className="h-3.5 w-3.5" />
                        Recently Updated
                    </h2>
                    {recent.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No pages yet.
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {recent.map((page) => {
                                const slug = slugById.get(page.collectionId);
                                if (!slug) return null;
                                return (
                                    <li key={page.id}>
                                        <Link
                                            href={`/wiki/${slug}/${page.id}`}
                                            className="text-sm hover:underline"
                                        >
                                            {page.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
