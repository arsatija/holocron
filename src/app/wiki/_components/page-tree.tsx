"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ChevronRight,
    FileText,
    MoreHorizontal,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageFormDialog } from "./page-form-dialog";
import {
    createPageAction,
    deletePageAction,
    updatePageAction,
} from "../_lib/actions";
import type { WikiPageTreeNode } from "@/services/wiki";

interface PageTreeProps {
    nodes: WikiPageTreeNode[];
    collectionId: string;
    collectionSlug: string;
    canEdit: boolean;
    emptyLabel?: string;
}

export function PageTree({
    nodes,
    collectionId,
    collectionSlug,
    canEdit,
    emptyLabel = "No pages yet.",
}: PageTreeProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [, startTransition] = useTransition();
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    // undefined = dialog closed, null = new top-level page, string = new subpage under that id
    const [newPageParent, setNewPageParent] = useState<string | null | undefined>(undefined);
    const [deletingNode, setDeletingNode] = useState<WikiPageTreeNode | null>(null);

    function toggle(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function startRename(node: WikiPageTreeNode) {
        setRenamingId(node.id);
        setRenameValue(node.title);
    }

    function commitRename(id: string) {
        const title = renameValue.trim();
        setRenamingId(null);
        if (!title) return;
        startTransition(async () => {
            const result = await updatePageAction(id, { title });
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                router.refresh();
            }
        });
    }

    async function handleCreate(title: string) {
        const result = await createPageAction({
            collectionId,
            parentPageId: newPageParent ?? null,
            title,
        });
        if (result && "error" in result) {
            toast.error(result.error);
            return;
        }
        setNewPageParent(undefined);
        router.refresh();
        if (result && "id" in result) {
            router.push(`/wiki/${collectionSlug}/${result.id}/edit`);
        }
    }

    function handleDelete() {
        if (!deletingNode) return;
        const node = deletingNode;
        startTransition(async () => {
            const result = await deletePageAction(node.id);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Page deleted");
                router.refresh();
            }
            setDeletingNode(null);
        });
    }

    function renderNodes(list: WikiPageTreeNode[], depth: number) {
        return (
            <ul className={depth > 0 ? "pl-4 border-l ml-2" : "space-y-0.5"}>
                {list.map((node) => {
                    const hasChildren = node.children.length > 0;
                    const isExpanded = expanded.has(node.id);
                    const isRenaming = renamingId === node.id;
                    const href = `/wiki/${collectionSlug}/${node.id}`;
                    const active = pathname === href;

                    return (
                        <li key={node.id}>
                            <div
                                className={cn(
                                    "group flex items-center gap-1 px-1 py-1 rounded-md text-sm",
                                    active
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(node.id)}
                                    className={cn(
                                        "h-4 w-4 shrink-0 flex items-center justify-center text-muted-foreground",
                                        !hasChildren && "invisible"
                                    )}
                                >
                                    <ChevronRight
                                        className={cn(
                                            "h-3 w-3 transition-transform",
                                            isExpanded && "rotate-90"
                                        )}
                                    />
                                </button>
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {isRenaming ? (
                                    <Input
                                        autoFocus
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onBlur={() => commitRename(node.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                commitRename(node.id);
                                            } else if (e.key === "Escape") {
                                                setRenamingId(null);
                                            }
                                        }}
                                        className="h-6 px-1 py-0 text-sm"
                                    />
                                ) : (
                                    <Link href={href} className="flex-1 truncate">
                                        {node.title}
                                    </Link>
                                )}
                                {!node.isPublished && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                                        Draft
                                    </Badge>
                                )}
                                {canEdit && !isRenaming && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                                            >
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => setNewPageParent(node.id)}>
                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                New subpage
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => startRename(node)}>
                                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onSelect={() => setDeletingNode(node)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                            {hasChildren && isExpanded && renderNodes(node.children, depth + 1)}
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <div>
            {canEdit && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="mb-1 h-7 text-xs -ml-2"
                    onClick={() => setNewPageParent(null)}
                >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    New page
                </Button>
            )}
            {nodes.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">{emptyLabel}</p>
            ) : (
                renderNodes(nodes, 0)
            )}

            <PageFormDialog
                open={newPageParent !== undefined}
                onOpenChange={(open) => {
                    if (!open) setNewPageParent(undefined);
                }}
                onSubmit={handleCreate}
            />

            <AlertDialog open={!!deletingNode} onOpenChange={(open) => !open && setDeletingNode(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete &ldquo;{deletingNode?.title}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletingNode && deletingNode.children.length > 0
                                ? `This also deletes ${deletingNode.children.length} subpage${deletingNode.children.length !== 1 ? "s" : ""} and all revisions. This cannot be undone.`
                                : "This deletes all revisions of this page. This cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
