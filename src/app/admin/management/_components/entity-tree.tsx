"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type TreeItem = {
    id: string;
    name: string;
    parentId: string | null;
    priority: number;
    [key: string]: unknown;
};

type TreeNode<T extends TreeItem> = T & { children: TreeNode<T>[] };

export function buildTree<T extends TreeItem>(items: T[]): TreeNode<T>[] {
    const map = new Map<string, TreeNode<T>>();
    const roots: TreeNode<T>[] = [];

    for (const item of items) {
        map.set(item.id, { ...item, children: [] });
    }

    for (const [, node] of map) {
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortNodes = (nodes: TreeNode<T>[]) => {
        nodes.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
        for (const node of nodes) sortNodes(node.children);
    };
    sortNodes(roots);

    return roots;
}

interface EntityTreeProps<T extends TreeItem> {
    items: T[];
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
    onAddChild: (parentId: string) => void;
    onAddRoot: () => void;
    renderMeta?: (item: T) => React.ReactNode;
    addLabel?: string;
}

export function EntityTree<T extends TreeItem>({
    items,
    onEdit,
    onDelete,
    onAddChild,
    onAddRoot,
    renderMeta,
    addLabel = "Add",
}: EntityTreeProps<T>) {
    const tree = buildTree(items);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                <Button size="sm" onClick={onAddRoot}>
                    <Plus className="h-4 w-4 mr-1" /> {addLabel}
                </Button>
            </div>
            <div className="rounded-md border divide-y">
                {tree.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No items yet.</p>
                ) : (
                    tree.map((node) => (
                        <TreeRow
                            key={node.id}
                            node={node}
                            depth={0}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            renderMeta={renderMeta}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

interface TreeRowProps<T extends TreeItem> {
    node: TreeNode<T>;
    depth: number;
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
    onAddChild: (parentId: string) => void;
    renderMeta?: (item: T) => React.ReactNode;
}

function TreeRow<T extends TreeItem>({
    node,
    depth,
    onEdit,
    onDelete,
    onAddChild,
    renderMeta,
}: TreeRowProps<T>) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-2 py-2.5 pr-3 hover:bg-muted/50 group",
                    depth === 0 ? "pl-3" : undefined
                )}
                style={{ paddingLeft: depth === 0 ? undefined : `${depth * 20 + 12}px` }}
            >
                <button
                    className="h-5 w-5 shrink-0 flex items-center justify-center text-muted-foreground"
                    onClick={() => hasChildren && setExpanded((e) => !e)}
                >
                    {hasChildren ? (
                        expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <span className="h-3.5 w-3.5 block border-l border-b border-muted-foreground/30 ml-1 mb-1" />
                    )}
                </button>
                <span className="flex-1 text-sm font-medium">{node.name}</span>
                {renderMeta && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderMeta(node)}
                    </div>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onAddChild(node.id)}
                        title="Add child"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onEdit(node)}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(node)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
            {hasChildren && expanded && (
                <div>
                    {node.children.map((child) => (
                        <TreeRow
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            renderMeta={renderMeta}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
