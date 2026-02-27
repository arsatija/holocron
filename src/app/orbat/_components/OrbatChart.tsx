"use client";

import "@xyflow/react/dist/style.css";
import { useState, useMemo, useCallback } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    type NodeTypes,
    type ColorMode,
    type Node,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { type BilletChainNode, type StructuredOrbatElement } from "../_lib/queries";
import { buildBilletGraph } from "../_lib/chartUtils";
import BilletNode from "./BilletNode";
import Orbat from "../orbat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const nodeTypes: NodeTypes = { billetNode: BilletNode };

export default function OrbatChart({
    data,
    departmentData,
}: {
    data: BilletChainNode[];
    departmentData: StructuredOrbatElement[];
}) {
    const { resolvedTheme } = useTheme();
    const colorMode = (resolvedTheme ?? "light") as ColorMode;
    const proOptions = { hideAttribution: true };

    const [collapsedIds, setCollapsedIds] = useState(() => new Set<string>());

    const reservists = useMemo(
        () =>
            data
                .filter((b) => b.isReservist)
                .sort((a, b) => a.unitElementName.localeCompare(b.unitElementName)),
        [data]
    );
    const activeBillets = useMemo(() => data.filter((b) => !b.isReservist), [data]);

    const allSuperiorIds = useMemo(() => {
        const ids = new Set(activeBillets.map((b) => b.id));
        return new Set(
            activeBillets
                .map((b) => b.superiorBilletId)
                .filter((id): id is string => !!id && ids.has(id))
        );
    }, [activeBillets]);

    const visibleBillets = useMemo(() => {
        const allIds = new Set(activeBillets.map((b) => b.id));
        const childrenOf = new Map<string, string[]>();
        for (const b of activeBillets) {
            if (b.superiorBilletId && allIds.has(b.superiorBilletId)) {
                if (!childrenOf.has(b.superiorBilletId)) childrenOf.set(b.superiorBilletId, []);
                childrenOf.get(b.superiorBilletId)!.push(b.id);
            }
        }
        const visible = new Set<string>();
        const queue = activeBillets
            .filter((b) => !b.superiorBilletId || !allIds.has(b.superiorBilletId))
            .map((b) => b.id);
        while (queue.length) {
            const id = queue.shift()!;
            visible.add(id);
            if (!collapsedIds.has(id)) {
                for (const childId of childrenOf.get(id) ?? []) queue.push(childId);
            }
        }
        return activeBillets.filter((b) => visible.has(b.id));
    }, [activeBillets, collapsedIds]);

    const { nodes, edges } = useMemo(
        () => buildBilletGraph(visibleBillets, allSuperiorIds, collapsedIds),
        [visibleBillets, allSuperiorIds, collapsedIds]
    );

    const handleNodeClick = useCallback(
        (_evt: React.MouseEvent, node: Node) => {
            if (!allSuperiorIds.has(node.id)) return;
            setCollapsedIds((prev) => {
                const next = new Set(prev);
                if (next.has(node.id)) next.delete(node.id);
                else next.add(node.id);
                return next;
            });
        },
        [allSuperiorIds]
    );

    return (
        <Tabs defaultValue="orbat" className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="px-4 pt-3 pb-0 flex-shrink-0">
                <TabsList className="w-full">
                    <TabsTrigger value="orbat" className="flex-1">ORBAT</TabsTrigger>
                    <TabsTrigger value="departments" className="flex-1">Departments</TabsTrigger>
                    <TabsTrigger value="reservists" className="flex-1">Reservists</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="orbat" className="flex-1 mt-0 min-h-0">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    colorMode={colorMode}
                    onNodeClick={handleNodeClick}
                    fitView
                    fitViewOptions={{ padding: 0.15 }}
                    minZoom={0.05}
                    maxZoom={2}
                    zoomOnScroll
                    panOnScroll={false}
                    preventScrolling
                    proOptions={proOptions}
                >
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                    <Controls showInteractive={false} position="top-right" />
                </ReactFlow>
            </TabsContent>

            <TabsContent value="departments" className="flex-1 mt-0 min-h-0 overflow-auto py-4">
                <Orbat data={departmentData} type="departments" />
            </TabsContent>

            <TabsContent value="reservists" className="flex-1 mt-0 min-h-0 overflow-auto px-4 py-3">
                {reservists.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reservist billets found.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="pb-2 pr-4 font-medium">Unit</th>
                                <th className="pb-2 pr-4 font-medium">Role</th>
                                <th className="pb-2 font-medium">Trooper</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservists.map((b) => {
                                const isVacant = !b.trooper;
                                const displayName = b.trooper
                                    ? `${b.trooper.rankAbbreviation} ${b.trooper.name}`
                                    : "Vacant";
                                return (
                                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                                        <td className="py-2.5 pr-4">
                                            <div className="flex items-center gap-2">
                                                {b.unitElementIcon && (
                                                    <Image
                                                        src={b.unitElementIcon}
                                                        alt={b.unitElementName}
                                                        width={20}
                                                        height={20}
                                                        className="object-contain"
                                                    />
                                                )}
                                                <span>{b.unitElementName}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 pr-4 text-muted-foreground">{b.role}</td>
                                        <td className="py-2.5">
                                            {isVacant ? (
                                                <span className="text-muted-foreground">{displayName}</span>
                                            ) : (
                                                <Link
                                                    href={`/trooper/${b.trooper!.id}`}
                                                    className="hover:underline hover:text-accent9th"
                                                >
                                                    {displayName}
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </TabsContent>
        </Tabs>
    );
}
