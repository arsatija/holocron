"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    BookOpen,
    ChevronRight,
    GripVertical,
    MoreHorizontal,
    Pencil,
    Pin,
    Plus,
    Star,
    Trash2,
} from "lucide-react";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
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
import { CollectionFormDialog } from "./collection-form-dialog";
import { PageTree } from "./page-tree";
import { WikiSearchDialog } from "./wiki-search-dialog";
import {
    deleteCollectionAction,
    reorderCollectionsAction,
} from "../_lib/actions";
import type {
    PermissionOption,
    PinnedSidebarPage,
    SidebarCollection,
    StarredSidebarPage,
} from "../_lib/queries";

interface WikiSidebarProps {
    collections: SidebarCollection[];
    canManage: boolean;
    permissionOptions: PermissionOption[];
    starred: StarredSidebarPage[];
    pinned: PinnedSidebarPage[];
    starredIds: Set<string>;
    // Lets callers swap the outer wrapper: the fixed-width bordered column on
    // desktop (default) vs. a full-width block inside the mobile Sheet.
    className?: string;
}

function SidebarPageLinks({
    label,
    icon,
    pages,
    activePathname,
}: {
    label: string;
    icon: React.ReactNode;
    pages: { pageId: string; title: string; collectionSlug: string }[];
    activePathname: string;
}) {
    if (pages.length === 0) return null;

    return (
        <div>
            <p className="px-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </p>
            <div className="flex flex-col gap-0.5">
                {pages.map((page) => {
                    const href = `/wiki/${page.collectionSlug}/${page.pageId}`;
                    return (
                        <Link
                            key={page.pageId}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm truncate transition-colors",
                                activePathname === href
                                    ? "bg-accent9th/10 text-foreground font-medium border-l-2 border-accent9th -ml-px pl-[calc(0.5rem+2px)]"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            {icon}
                            <span className="truncate">{page.title}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

interface CollectionRowProps {
    collection: SidebarCollection;
    active: boolean;
    isOpen: boolean;
    canManage: boolean;
    starredIds: Set<string>;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function CollectionRow({
    collection,
    active,
    isOpen,
    canManage,
    starredIds,
    onToggle,
    onEdit,
    onDelete,
}: CollectionRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: collection.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.4 : 1,
    };

    const href = `/wiki/${collection.slug}`;

    const menuItems = canManage
        ? [
              { key: "edit", label: "Edit collection", icon: Pencil, onSelect: onEdit },
              {
                  key: "delete",
                  label: "Delete collection",
                  icon: Trash2,
                  onSelect: onDelete,
                  destructive: true,
              },
          ]
        : [];

    const row = (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center gap-1 rounded-md text-sm transition-colors",
                active
                    ? "bg-accent9th/10 text-foreground font-medium border-l-2 rounded-none border-accent9th -ml-px pl-[1px]"
                    : "hover:bg-accent hover:text-accent-foreground"
            )}
        >
            {canManage && (
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="h-5 w-5 shrink-0 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="h-3 w-3" />
                </button>
            )}
            <button
                type="button"
                onClick={onToggle}
                className="h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground"
            >
                <ChevronRight
                    className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")}
                />
            </button>
            <Link href={href} className="flex-1 flex items-center gap-2 py-1.5 truncate">
                <span className="shrink-0">{collection.icon || "📄"}</span>
                <span className="truncate">{collection.name}</span>
            </Link>
            {canManage && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 mr-1 opacity-0 group-hover:opacity-100 shrink-0"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {menuItems.map((item) => (
                            <DropdownMenuItem
                                key={item.key}
                                onSelect={item.onSelect}
                                className={item.destructive ? "text-destructive focus:text-destructive" : undefined}
                            >
                                <item.icon className="h-3.5 w-3.5 mr-2" />
                                {item.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );

    return (
        <div>
            {canManage ? (
                <ContextMenu>
                    <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
                    <ContextMenuContent>
                        {menuItems.map((item) => (
                            <ContextMenuItem
                                key={item.key}
                                onSelect={item.onSelect}
                                className={item.destructive ? "text-destructive focus:text-destructive" : undefined}
                            >
                                <item.icon className="h-3.5 w-3.5 mr-2" />
                                {item.label}
                            </ContextMenuItem>
                        ))}
                    </ContextMenuContent>
                </ContextMenu>
            ) : (
                row
            )}
            {isOpen && (
                <div className="pl-3">
                    <PageTree
                        nodes={collection.tree}
                        collectionId={collection.id}
                        collectionSlug={collection.slug}
                        canEdit={collection.canEdit}
                        canManage={canManage}
                        starredIds={starredIds}
                        emptyLabel="No pages yet."
                    />
                </div>
            )}
        </div>
    );
}

export function WikiSidebar({
    collections,
    canManage,
    permissionOptions,
    starred,
    pinned,
    starredIds,
    className,
}: WikiSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [formOpen, setFormOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<SidebarCollection | null>(null);
    const [deletingCollection, setDeletingCollection] = useState<SidebarCollection | null>(null);
    const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(collections.map((c) => c.id))
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function toggle(id: string) {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = collections.findIndex((c) => c.id === active.id);
        const newIndex = collections.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(collections, oldIndex, newIndex).map((c, index) => ({
            id: c.id,
            order: index,
        }));

        startTransition(async () => {
            const result = await reorderCollectionsAction(reordered);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                router.refresh();
            }
        });
    }

    function handleDeleteCollection() {
        if (!deletingCollection) return;
        const collection = deletingCollection;
        startTransition(async () => {
            const result = await deleteCollectionAction(collection.id);
            if (result && "error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Collection deleted");
                if (pathname.startsWith(`/wiki/${collection.slug}`)) {
                    router.push("/wiki");
                }
                router.refresh();
            }
            setDeletingCollection(null);
        });
    }

    return (
        <div className={cn("w-72 shrink-0 border-r border-accent9th/20 pr-4 space-y-4", className)}>
            <WikiSearchDialog />

            <Link
                href="/wiki"
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                    pathname === "/wiki"
                        ? "bg-accent9th/10 text-foreground border-l-2 rounded-none border-accent9th -ml-px pl-[calc(0.5rem+2px)]"
                        : "hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <BookOpen className="h-4 w-4" />
                Wiki Home
            </Link>

            <SidebarPageLinks
                label="Pinned"
                icon={<Pin className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
                pages={pinned}
                activePathname={pathname}
            />

            <SidebarPageLinks
                label="Starred"
                icon={<Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
                pages={starred}
                activePathname={pathname}
            />

            <div>
                <div className="flex items-center justify-between px-2 pb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Collections
                    </p>
                    {canManage && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => setFormOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                {collections.length === 0 && (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                        No collections yet.
                    </p>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={collections.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-0.5">
                            {collections.map((collection) => {
                                const href = `/wiki/${collection.slug}`;
                                const active = pathname.startsWith(href);
                                const isOpen = active || !collapsed.has(collection.id);

                                return (
                                    <CollectionRow
                                        key={collection.id}
                                        collection={collection}
                                        active={active}
                                        isOpen={isOpen}
                                        canManage={canManage}
                                        starredIds={starredIds}
                                        onToggle={() => toggle(collection.id)}
                                        onEdit={() => setEditingCollection(collection)}
                                        onDelete={() => setDeletingCollection(collection)}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {canManage && (
                <CollectionFormDialog
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    permissionOptions={permissionOptions}
                    onSuccess={(slug) => {
                        router.refresh();
                        if (slug) router.push(`/wiki/${slug}`);
                    }}
                />
            )}

            {canManage && editingCollection && (
                <CollectionFormDialog
                    open={!!editingCollection}
                    onOpenChange={(open) => !open && setEditingCollection(null)}
                    defaultValues={{
                        id: editingCollection.id,
                        name: editingCollection.name,
                        description: editingCollection.description ?? "",
                        icon: editingCollection.icon ?? "",
                        readPermissions: editingCollection.readPermissions,
                        editPermissions: editingCollection.editPermissions,
                    }}
                    permissionOptions={permissionOptions}
                    onSuccess={() => {
                        setEditingCollection(null);
                        router.refresh();
                    }}
                />
            )}

            <AlertDialog
                open={!!deletingCollection}
                onOpenChange={(open) => !open && setDeletingCollection(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete collection &ldquo;{deletingCollection?.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This deletes every page, revision, star, and link in this
                            collection. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteCollection}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
