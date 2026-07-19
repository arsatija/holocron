import Link from "next/link";
import { Link2 } from "lucide-react";

interface Backlink {
    id: string;
    title: string;
    collectionSlug: string;
}

export function BacklinksPanel({ backlinks }: { backlinks: Backlink[] }) {
    if (backlinks.length === 0) return null;

    return (
        <div className="border-t pt-4 mt-8">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Link2 className="h-3.5 w-3.5" />
                Linked from
            </h2>
            <ul className="space-y-1">
                {backlinks.map((link) => (
                    <li key={link.id}>
                        <Link
                            href={`/wiki/${link.collectionSlug}/${link.id}`}
                            className="text-sm hover:underline"
                        >
                            {link.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
