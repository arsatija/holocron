import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WikiPageTreeNode } from "@/services/wiki";

// Read-only rendering of the page tree for the collection landing page.
// Interactive create/rename/delete/drag lands in Phase 4.
export function PageTreeView({
    nodes,
    collectionSlug,
    depth = 0,
}: {
    nodes: WikiPageTreeNode[];
    collectionSlug: string;
    depth?: number;
}) {
    if (nodes.length === 0 && depth === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No pages yet in this collection.
            </p>
        );
    }

    return (
        <ul className={depth > 0 ? "pl-5 border-l ml-2" : "space-y-0.5"}>
            {nodes.map((node) => (
                <li key={node.id}>
                    <Link
                        href={`/wiki/${collectionSlug}/${node.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{node.title}</span>
                        {!node.isPublished && (
                            <Badge variant="outline" className="text-xs shrink-0">
                                Draft
                            </Badge>
                        )}
                    </Link>
                    {node.children.length > 0 && (
                        <PageTreeView
                            nodes={node.children}
                            collectionSlug={collectionSlug}
                            depth={depth + 1}
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}
