"use client";

import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    type NodeTypes,
    type ColorMode,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { type BilletChainNode } from "../_lib/queries";
import { buildBilletGraph } from "../_lib/chartUtils";
import BilletNode from "./BilletNode";

const nodeTypes: NodeTypes = { billetNode: BilletNode };

export default function OrbatChart({ data }: { data: BilletChainNode[] }) {
    const { resolvedTheme } = useTheme();
    const colorMode = (resolvedTheme ?? "light") as ColorMode;
    const { nodes, edges } = useMemo(() => buildBilletGraph(data), [data]);
    const proOptions = { hideAttribution: true };

    return (
        <div className="w-full h-[calc(100vh-4rem)]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                colorMode={colorMode}
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
        </div>
    );
}
