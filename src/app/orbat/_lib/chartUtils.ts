import dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";
import { type StructuredOrbatElement } from "./queries";

export interface OrbatNodeData extends Record<string, unknown> {
    name: string;
    billets: { role: string; name: string; trooperId: string }[];
    hasParent: boolean;
    hasChildren: boolean;
}

const NODE_WIDTH = 280;
const BILLET_ROW_HEIGHT = 28;
const NODE_HEADER_HEIGHT = 36;
const NODE_MIN_HEIGHT = 60;

function calcNodeHeight(billetCount: number): number {
    return Math.max(NODE_MIN_HEIGHT, NODE_HEADER_HEIGHT + billetCount * BILLET_ROW_HEIGHT);
}

export function buildOrbatGraph(elements: StructuredOrbatElement[]): {
    nodes: Node<OrbatNodeData>[];
    edges: Edge[];
} {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40, marginx: 40, marginy: 40 });

    const nodes: Node<OrbatNodeData>[] = [];
    const edges: Edge[] = [];

    function walk(el: StructuredOrbatElement, parentId: string | null): void {
        const height = calcNodeHeight(el.billets.length);
        g.setNode(el.id, { width: NODE_WIDTH, height });
        nodes.push({
            id: el.id,
            type: "orbatNode",
            position: { x: 0, y: 0 },
            data: {
                name: el.name,
                billets: el.billets,
                hasParent: parentId !== null,
                hasChildren: el.elements.length > 0,
            },
        });

        if (parentId) {
            g.setEdge(parentId, el.id);
            edges.push({
                id: `${parentId}->${el.id}`,
                source: parentId,
                target: el.id,
                type: "smoothstep",
            });
        }

        for (const child of el.elements) walk(child, el.id);
    }

    for (const root of elements) walk(root, null);

    dagre.layout(g);

    for (const node of nodes) {
        const { x, y, width } = g.node(node.id);
        node.position = { x: x - width / 2, y: y - calcNodeHeight((node.data.billets as OrbatNodeData["billets"]).length) / 2 };
        node.style = { width };
    }

    return { nodes, edges };
}
