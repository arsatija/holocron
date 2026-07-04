"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCorners,
    useSensor,
    useSensors,
    useDroppable,
    type DragStartEvent,
    type DragOverEvent,
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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
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
import { PositionForm } from "./position-form";
import { deleteDepartmentPositionAction, bulkUpdatePositionOrderAction } from "../_lib/actions";
import { DragSaveBar } from "../../_components/drag-save-bar";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Position = {
    id: string;
    role: string;
    slug: string | null;
    departmentId: string | null;
    departmentName: string | null;
    superiorPositionId: string | null;
    priority: number;
};

type DeptOption = { id: string; name: string };
type GroupedPositions = Record<string, Position[]>;

function groupByDept(positions: Position[], departments: DeptOption[]): GroupedPositions {
    const groups: GroupedPositions = {};
    for (const d of departments) groups[d.id] = [];
    groups["__unassigned__"] = [];
    for (const p of positions) {
        const key = p.departmentId ?? "__unassigned__";
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    }
    for (const key in groups) {
        groups[key].sort((a, b) => a.priority - b.priority);
    }
    return groups;
}

function findContainer(groups: GroupedPositions, id: string): string | null {
    if (id in groups) return id;
    for (const [gid, items] of Object.entries(groups)) {
        if (items.some((i) => i.id === id)) return gid;
    }
    return null;
}

// ── Sortable row ───────────────────────────────────────────────────────────────

interface SortablePositionRowProps {
    position: Position;
    onEdit: (p: Position) => void;
    onDelete: (p: Position) => void;
    overlay?: boolean;
}

function SortablePositionRow({ position, onEdit, onDelete, overlay }: SortablePositionRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: position.id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 px-3 py-2.5 bg-background border-b last:border-b-0 group",
                overlay && "rounded-md border shadow-md"
            )}
        >
            <button
                className="cursor-grab text-muted-foreground hover:text-foreground shrink-0"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <span className="flex-1 text-sm font-medium">{position.role}</span>
            {position.slug && (
                <span className="font-mono text-xs text-muted-foreground">{position.slug}</span>
            )}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(position)}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(position)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ── Group container ────────────────────────────────────────────────────────────

interface GroupContainerProps {
    groupId: string;
    label: string;
    items: Position[];
    onEdit: (p: Position) => void;
    onDelete: (p: Position) => void;
    onAdd: (deptId: string) => void;
}

function GroupContainer({ groupId, label, items, onEdit, onDelete, onAdd }: GroupContainerProps) {
    const { setNodeRef } = useDroppable({ id: groupId });
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
                <button
                    className="flex items-center gap-1.5 text-sm font-semibold hover:text-foreground transition-colors"
                    onClick={() => setCollapsed((c) => !c)}
                >
                    {collapsed
                        ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    {label}
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                    {groupId !== "__unassigned__" && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAdd(groupId)}>
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>
            {!collapsed && (
                <div ref={setNodeRef} className="min-h-[2rem]">
                    <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        {items.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-3 py-3">Drop items here</p>
                        ) : (
                            items.map((pos) => (
                                <SortablePositionRow
                                    key={pos.id}
                                    position={pos}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PositionsDragList({
    positions: initialPositions,
    departments,
}: {
    positions: Position[];
    departments: DeptOption[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [groups, setGroups] = useState<GroupedPositions>(() => groupByDept(initialPositions, departments));

    useEffect(() => {
        setGroups(groupByDept(initialPositions, departments));
    }, [initialPositions, departments]);
    const [isDirty, setIsDirty] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Position | null>(null);
    const [prefilledDeptId, setPrefilledDeptId] = useState<string | undefined>();
    const [deleting, setDeleting] = useState<Position | null>(null);
    const originalGroups = useRef<GroupedPositions | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const allPositions = Object.values(groups).flat();
    const activeItem = activeId ? allPositions.find((p) => p.id === activeId) ?? null : null;

    const positionOptions = allPositions.map((p) => ({
        id: p.id,
        role: p.role,
        departmentId: p.departmentId ?? "",
    }));

    function handleDragStart({ active }: DragStartEvent) {
        setActiveId(active.id as string);
        originalGroups.current = JSON.parse(JSON.stringify(groups));
    }

    function handleDragOver({ active, over }: DragOverEvent) {
        if (!over) return;
        const activeId = active.id as string;
        const overId = over.id as string;

        const activeContainer = findContainer(groups, activeId);
        const overContainer = findContainer(groups, overId) ?? (groups[overId] !== undefined ? overId : null);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setGroups((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex((i) => i.id === activeId);
            const overIndex = overItems.findIndex((i) => i.id === overId);

            const newIndex = overIndex >= 0 ? overIndex : overItems.length;
            const movedItem = {
                ...activeItems[activeIndex],
                departmentId: overContainer === "__unassigned__" ? null : overContainer,
                departmentName: departments.find((d) => d.id === overContainer)?.name ?? null,
            };

            return {
                ...prev,
                [activeContainer]: activeItems.filter((i) => i.id !== activeId),
                [overContainer]: [
                    ...overItems.slice(0, newIndex),
                    movedItem,
                    ...overItems.slice(newIndex),
                ],
            };
        });
    }

    function handleDragEnd({ active, over }: DragEndEvent) {
        setActiveId(null);

        if (!over) {
            if (originalGroups.current) setGroups(originalGroups.current);
            originalGroups.current = null;
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;
        const activeContainer = findContainer(groups, activeId);
        const overContainer = findContainer(groups, overId) ?? (groups[overId] !== undefined ? overId : null);

        if (!activeContainer) {
            originalGroups.current = null;
            return;
        }

        if (activeContainer === overContainer) {
            const items = groups[activeContainer];
            const oldIndex = items.findIndex((i) => i.id === activeId);
            const newIndex = items.findIndex((i) => i.id === overId);
            if (oldIndex !== newIndex) {
                setGroups((prev) => ({
                    ...prev,
                    [activeContainer]: arrayMove(prev[activeContainer], oldIndex, newIndex),
                }));
            }
        }

        setGroups((prev) => {
            const updated: GroupedPositions = {};
            for (const [gid, items] of Object.entries(prev)) {
                updated[gid] = items.map((item, idx) => ({ ...item, priority: idx }));
            }
            return updated;
        });

        setIsDirty(true);
        originalGroups.current = null;
    }

    const handleSave = useCallback(() => {
        const unassignedDeptId = departments[0]?.id ?? "";
        const updates = Object.entries(groups).flatMap(([gid, items]) =>
            items
                .filter((p) => p.departmentId !== null)
                .map((p, idx) => ({
                    id: p.id,
                    departmentId: gid === "__unassigned__" ? unassignedDeptId : gid,
                    priority: idx,
                }))
        );

        startTransition(async () => {
            const result = await bulkUpdatePositionOrderAction(updates);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Order saved");
                setIsDirty(false);
                router.refresh();
            }
        });
    }, [groups, departments, router]);

    const handleDiscard = useCallback(() => {
        setGroups(groupByDept(initialPositions, departments));
        setIsDirty(false);
    }, [initialPositions, departments]);

    function handleEdit(pos: Position) {
        setEditing(pos);
        setPrefilledDeptId(undefined);
        setFormOpen(true);
    }

    function handleAdd(deptId: string) {
        setEditing(null);
        setPrefilledDeptId(deptId);
        setFormOpen(true);
    }

    function handleDeleteConfirm() {
        if (!deleting) return;
        startTransition(async () => {
            const result = await deleteDepartmentPositionAction(deleting.id);
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Position deleted");
                router.refresh();
            }
            setDeleting(null);
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{allPositions.length} position{allPositions.length !== 1 ? "s" : ""}</p>
                <Button size="sm" onClick={() => { setEditing(null); setPrefilledDeptId(undefined); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Position
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-3">
                    {departments.map((dept) => (
                        <GroupContainer
                            key={dept.id}
                            groupId={dept.id}
                            label={dept.name}
                            items={groups[dept.id] ?? []}
                            onEdit={handleEdit}
                            onDelete={setDeleting}
                            onAdd={handleAdd}
                        />
                    ))}
                    {(groups["__unassigned__"]?.length ?? 0) > 0 && (
                        <GroupContainer
                            groupId="__unassigned__"
                            label="Unassigned"
                            items={groups["__unassigned__"] ?? []}
                            onEdit={handleEdit}
                            onDelete={setDeleting}
                            onAdd={() => {}}
                        />
                    )}
                </div>

                <DragOverlay>
                    {activeItem && (
                        <SortablePositionRow
                            position={activeItem}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            overlay
                        />
                    )}
                </DragOverlay>
            </DndContext>

            <PositionForm
                open={formOpen}
                onOpenChange={setFormOpen}
                defaultValues={editing ? {
                    id: editing.id,
                    role: editing.role,
                    slug: editing.slug,
                    departmentId: editing.departmentId ?? "",
                    superiorPositionId: editing.superiorPositionId,
                    priority: editing.priority,
                } : undefined}
                deptOptions={departments}
                positionOptions={positionOptions}
                prefilledDeptId={prefilledDeptId}
                onSuccess={() => router.refresh()}
            />

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete position &ldquo;{deleting?.role}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the position and all trooper assignments to it. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteConfirm}
                            disabled={isPending}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DragSaveBar
                isDirty={isDirty}
                isPending={isPending}
                onSave={handleSave}
                onDiscard={handleDiscard}
            />
        </div>
    );
}
