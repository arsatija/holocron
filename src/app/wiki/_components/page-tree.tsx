"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ChevronRight,
    FileText,
    GripVertical,
    MoreHorizontal,
    Pencil,
    Pin,
    PinOff,
    Plus,
    Star,
    StarOff,
    Trash2,
} from "lucide-react";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
    type DragMoveEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
    reorderPagesAction,
    toggleStarAction,
    togglePinAction,
    updatePageAction,
} from "../_lib/actions";
import type { ReorderPageUpdate, WikiPageTreeNode } from "@/services/wiki";

const INDENTATION_WIDTH = 20;

interface FlatItem {
    id: string;
    parentId: string | null;
    depth: number;
    node: WikiPageTreeNode;
}

function flattenTree(
    nodes: WikiPageTreeNode[],
    expanded: Set<string>,
    parentId: string | null = null,
    depth = 0
): FlatItem[] {
    const result: FlatItem[] = [];
    for (const node of nodes) {
        result.push({ id: node.id, parentId, depth, node });
        if (node.children.length > 0 && expanded.has(node.id)) {
            result.push(...flattenTree(node.children, expanded, node.id, depth + 1));
        }
    }
    return result;
}

// Adapted from dnd-kit's official "sortable tree" pattern: given a flat,
// depth-first list of visible items, work out where the dragged item would
// land — both its new sibling position (over) and its new depth/parent,
// derived from how far it's been dragged horizontally.
function getProjection(
    items: FlatItem[],
    activeId: string,
    overId: string,
    dragOffset: number
): { depth: number; parentId: string | null } | null {
    const overItemIndex = items.findIndex((i) => i.id === overId);
    const activeItemIndex = items.findIndex((i) => i.id === activeId);
    if (overItemIndex === -1 || activeItemIndex === -1) return null;

    const activeItem = items[activeItemIndex];
    const newItems = arrayMove(items, activeItemIndex, overItemIndex);
    const previousItem = newItems[overItemIndex - 1];
    const nextItem = newItems[overItemIndex + 1];
    const dragDepth = Math.round(dragOffset / INDENTATION_WIDTH);
    const projectedDepth = activeItem.depth + dragDepth;
    const maxDepth = previousItem ? previousItem.depth + 1 : 0;
    const minDepth = nextItem ? nextItem.depth : 0;

    let depth = projectedDepth;
    if (projectedDepth >= maxDepth) depth = maxDepth;
    else if (projectedDepth < minDepth) depth = minDepth;

    let parentId: string | null = null;
    if (depth !== 0 && previousItem) {
        if (depth === previousItem.depth) {
            parentId = previousItem.parentId;
        } else if (depth > previousItem.depth) {
            parentId = previousItem.id;
        } else {
            parentId =
                newItems
                    .slice(0, overItemIndex)
                    .reverse()
                    .find((item) => item.depth === depth)?.parentId ?? null;
        }
    }

    return { depth, parentId };
}

interface PageMenuAction {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onSelect: () => void;
    destructive?: boolean;
}

interface PageTreeRowProps {
    item: FlatItem;
    depth: number;
    href: string;
    active: boolean;
    isExpanded: boolean;
    isRenaming: boolean;
    renameValue: string;
    isStarred: boolean;
    canEdit: boolean;
    canManage: boolean;
    onToggle: () => void;
    onRenameChange: (value: string) => void;
    onCommitRename: () => void;
    onCancelRename: () => void;
    onStartRename: () => void;
    onNewSubpage: () => void;
    onDelete: () => void;
    onToggleStar: () => void;
    onTogglePin: () => void;
}

function PageTreeRow({
    item,
    depth,
    href,
    active,
    isExpanded,
    isRenaming,
    renameValue,
    isStarred,
    canEdit,
    canManage,
    onToggle,
    onRenameChange,
    onCommitRename,
    onCancelRename,
    onStartRename,
    onNewSubpage,
    onDelete,
    onToggleStar,
    onTogglePin,
}: PageTreeRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        marginLeft: depth * INDENTATION_WIDTH,
        opacity: isDragging ? 0.4 : 1,
    };

    const hasChildren = item.node.children.length > 0;

    const menuActions: PageMenuAction[] = [
        {
            key: "star",
            label: isStarred ? "Unstar" : "Star",
            icon: isStarred ? StarOff : Star,
            onSelect: onToggleStar,
        },
        // Pinning is admin-forced (visible to everyone), so it's gated
        // separately from canEdit — see wiki-permissions.ts.
        ...(canManage
            ? [
                  {
                      key: "pin",
                      label: item.node.isPinned ? "Unpin" : "Pin for everyone",
                      icon: item.node.isPinned ? PinOff : Pin,
                      onSelect: onTogglePin,
                  },
              ]
            : []),
        ...(canEdit
            ? [
                  { key: "new-subpage", label: "New subpage", icon: Plus, onSelect: onNewSubpage },
                  { key: "rename", label: "Rename", icon: Pencil, onSelect: onStartRename },
                  {
                      key: "delete",
                      label: "Delete",
                      icon: Trash2,
                      onSelect: onDelete,
                      destructive: true,
                  },
              ]
            : []),
    ];

    const row = (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center gap-1 px-1 py-1 rounded-md text-sm",
                active
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
            )}
        >
            {canEdit ? (
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="h-4 w-4 shrink-0 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="h-3 w-3" />
                </button>
            ) : (
                <span className="h-4 w-4 shrink-0" />
            )}
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "h-4 w-4 shrink-0 flex items-center justify-center text-muted-foreground",
                    !hasChildren && "invisible"
                )}
            >
                <ChevronRight
                    className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")}
                />
            </button>
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {isRenaming ? (
                <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => onRenameChange(e.target.value)}
                    onBlur={onCommitRename}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onCommitRename();
                        } else if (e.key === "Escape") {
                            onCancelRename();
                        }
                    }}
                    className="h-6 px-1 py-0 text-sm"
                />
            ) : (
                <Link href={href} className="flex-1 truncate">
                    {item.node.title}
                </Link>
            )}
            {item.node.isPinned && (
                <Pin className="h-3 w-3 shrink-0 fill-primary text-primary" />
            )}
            {isStarred && (
                <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
            {!item.node.isPublished && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                    Draft
                </Badge>
            )}
            {!isRenaming && (canEdit || canManage) && (
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
                        {menuActions.map((a) => (
                            <DropdownMenuItem
                                key={a.key}
                                onSelect={a.onSelect}
                                className={a.destructive ? "text-destructive focus:text-destructive" : undefined}
                            >
                                <a.icon className="h-3.5 w-3.5 mr-2" />
                                {a.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );

    return (
        <li>
            {(canEdit || canManage) ? (
                <ContextMenu>
                    <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
                    <ContextMenuContent>
                        {menuActions.map((a) => (
                            <ContextMenuItem
                                key={a.key}
                                onSelect={a.onSelect}
                                className={a.destructive ? "text-destructive focus:text-destructive" : undefined}
                            >
                                <a.icon className="h-3.5 w-3.5 mr-2" />
                                {a.label}
                            </ContextMenuItem>
                        ))}
                    </ContextMenuContent>
                </ContextMenu>
            ) : (
                row
            )}
        </li>
    );
}

interface PageTreeProps {
    nodes: WikiPageTreeNode[];
    collectionId: string;
    collectionSlug: string;
    canEdit: boolean;
    // Pin/unpin is admin-forced (visible to everyone), gated separately from
    // canEdit — only shown in the menu when the viewer is a wiki manager.
    canManage: boolean;
    starredIds: Set<string>;
    emptyLabel?: string;
}

export function PageTree({
    nodes,
    collectionId,
    collectionSlug,
    canEdit,
    canManage,
    starredIds,
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
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [offsetLeft, setOffsetLeft] = useState(0);

    const flattenedItems = useMemo(() => flattenTree(nodes, expanded), [nodes, expanded]);

    const projected =
        activeId && overId ? getProjection(flattenedItems, activeId, overId, offsetLeft) : null;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

    function handleToggleStar(pageId: string) {
        startTransition(async () => {
            const result = await toggleStarAction(pageId);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                router.refresh();
            }
        });
    }

    function handleTogglePin(pageId: string) {
        startTransition(async () => {
            const result = await togglePinAction(pageId);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                router.refresh();
            }
        });
    }

    function resetDrag() {
        setActiveId(null);
        setOverId(null);
        setOffsetLeft(0);
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
        setOverId(event.active.id as string);
    }

    function handleDragMove(event: DragMoveEvent) {
        setOffsetLeft(event.delta.x);
        setOverId((event.over?.id as string) ?? null);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        const finalProjection = over
            ? getProjection(flattenedItems, active.id as string, over.id as string, offsetLeft)
            : null;

        resetDrag();

        if (!over || !finalProjection) return;

        const activeIndex = flattenedItems.findIndex((i) => i.id === active.id);
        const overIndex = flattenedItems.findIndex((i) => i.id === over.id);
        if (activeIndex === -1 || overIndex === -1) return;

        const reordered = arrayMove(flattenedItems, activeIndex, overIndex).map((item) =>
            item.id === active.id
                ? { ...item, depth: finalProjection.depth, parentId: finalProjection.parentId }
                : item
        );

        const originalById = new Map(flattenedItems.map((i) => [i.id, i]));
        const counters = new Map<string | null, number>();
        const updates: ReorderPageUpdate[] = [];

        for (const item of reordered) {
            const order = counters.get(item.parentId) ?? 0;
            counters.set(item.parentId, order + 1);
            const original = originalById.get(item.id);
            if (!original || original.parentId !== item.parentId || original.node.order !== order) {
                updates.push({ pageId: item.id, parentPageId: item.parentId, order });
            }
        }

        if (updates.length === 0) return;

        // Keep the moved page's new parent expanded so it stays visible.
        if (finalProjection.parentId) {
            const newParentId = finalProjection.parentId;
            setExpanded((prev) => new Set(prev).add(newParentId));
        }

        startTransition(async () => {
            const result = await reorderPagesAction(collectionId, updates);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                router.refresh();
            }
        });
    }

    const activeNode = activeId
        ? flattenedItems.find((i) => i.id === activeId)?.node
        : null;

    return (
        <div>
            {nodes.length === 0 ? (
                <p className="flex items-center gap-1 px-1 py-1 text-sm text-muted-foreground italic pl-11">
                    {emptyLabel}
                </p>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    onDragCancel={resetDrag}
                >
                    <SortableContext
                        items={flattenedItems.map((i) => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="space-y-0.5">
                            {flattenedItems.map((item) => {
                                const href = `/wiki/${collectionSlug}/${item.id}`;
                                return (
                                    <PageTreeRow
                                        key={item.id}
                                        item={item}
                                        depth={
                                            item.id === activeId && projected
                                                ? projected.depth
                                                : item.depth
                                        }
                                        href={href}
                                        active={pathname === href}
                                        isExpanded={expanded.has(item.id)}
                                        isRenaming={renamingId === item.id}
                                        renameValue={renameValue}
                                        isStarred={starredIds.has(item.id)}
                                        canEdit={canEdit}
                                        canManage={canManage}
                                        onToggle={() => toggle(item.id)}
                                        onRenameChange={setRenameValue}
                                        onCommitRename={() => commitRename(item.id)}
                                        onCancelRename={() => setRenamingId(null)}
                                        onStartRename={() => startRename(item.node)}
                                        onNewSubpage={() => setNewPageParent(item.id)}
                                        onDelete={() => setDeletingNode(item.node)}
                                        onToggleStar={() => handleToggleStar(item.id)}
                                        onTogglePin={() => handleTogglePin(item.id)}
                                    />
                                );
                            })}
                        </ul>
                    </SortableContext>
                    <DragOverlay>
                        {activeNode ? (
                            <div
                                className="flex items-center gap-1.5 rounded-md border bg-popover px-2 py-1 text-sm shadow-md"
                                style={{ marginLeft: (projected?.depth ?? 0) * INDENTATION_WIDTH }}
                            >
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {activeNode.title}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {canEdit && (
                <button
                    type="button"
                    onClick={() => setNewPageParent(null)}
                    className="mt-0.5 flex w-full items-center gap-1 rounded-md px-1 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground pl-11"
                >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 text-left">New page</span>
                </button>
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
