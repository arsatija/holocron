import Link from "next/link";
import { getWikiHomeData } from "./_lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Clock, Pin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WikiHomePage() {
    const { collections, starred, recent, pinned } = await getWikiHomeData();
    const slugById = new Map(collections.map((c) => [c.id, c.slug]));

    return (
        <div className="h-full overflow-y-auto">
        <div className="space-y-8">
            {/* 9th Corps grid banner */}
            <div className="relative rounded-lg overflow-hidden border border-accent9th/25 bg-background">
                <div
                    className="absolute inset-0 opacity-[0.08] dark:opacity-[0.22]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        maskImage:
                            "radial-gradient(ellipse 120% 100% at 0% 50%, black 0%, black 20%, transparent 75%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse 120% 100% at 0% 50%, black 0%, black 20%, transparent 75%)",
                    }}
                />
                <div className="relative px-6 py-5 border-l-4 border-accent9th">
                    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-accent9th mb-1">
                        9th Assault Corps
                    </p>
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        <span className="text-accent9th mr-1.5">//</span>Wiki
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Browse collections or search for a page.
                    </p>
                </div>
            </div>

            {pinned.length > 0 && (
                <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        <span className="text-accent9th font-bold">//</span>
                        <Pin className="h-3.5 w-3.5" />
                        Pinned
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pinned.map((page) => {
                            const slug = slugById.get(page.collectionId);
                            if (!slug) return null;
                            return (
                                <Link key={page.id} href={`/wiki/${slug}/${page.id}`}>
                                    <Card className="h-full transition-all hover:border-accent9th/40 group">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base group-hover:text-accent9th transition-colors">
                                                <Pin className="h-3.5 w-3.5 shrink-0 fill-accent9th text-accent9th" />
                                                <span className="truncate">{page.title}</span>
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    <span className="text-accent9th font-bold">//</span>
                    Collections
                </h2>
                {collections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No collections yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {collections.map((collection) => (
                            <Link key={collection.id} href={`/wiki/${collection.slug}`}>
                                <Card className="h-full transition-all hover:border-accent9th/40 group">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base group-hover:text-accent9th transition-colors">
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
                        <span className="text-accent9th font-bold">//</span>
                        <Star className="h-3.5 w-3.5" />
                        Starred
                    </h2>
                    {starred.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Star pages to see them here.</p>
                    ) : (
                        <ul className="space-y-1">
                            {starred.map((page) => {
                                const slug = slugById.get(page.collectionId);
                                if (!slug) return null;
                                return (
                                    <li key={page.pageId}>
                                        <Link
                                            href={`/wiki/${slug}/${page.pageId}`}
                                            className="text-sm hover:text-accent9th hover:underline transition-colors"
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
                        <span className="text-accent9th font-bold">//</span>
                        <Clock className="h-3.5 w-3.5" />
                        Recently Updated
                    </h2>
                    {recent.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No pages yet.</p>
                    ) : (
                        <ul className="space-y-1">
                            {recent.map((page) => {
                                const slug = slugById.get(page.collectionId);
                                if (!slug) return null;
                                return (
                                    <li key={page.id}>
                                        <Link
                                            href={`/wiki/${slug}/${page.id}`}
                                            className="text-sm hover:text-accent9th hover:underline transition-colors"
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
        </div>
    );
}
