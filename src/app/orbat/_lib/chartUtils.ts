import dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";
import { type StructuredOrbatElement, type BilletChainNode } from "./queries";

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

// ─── Billet chain graph ───────────────────────────────────────────────────────

export interface BilletNodeData extends Record<string, unknown> {
    role: string;
    unitElementName: string;
    unitElementIcon: string;
    trooper: {
        id: string;
        name: string;
        numbers: number;
        rankAbbreviation: string;
    } | null;
    hasParent: boolean;
    hasChildren: boolean;
    isCollapsed: boolean;
}

const BILLET_NODE_WIDTH = 230;
const BILLET_NODE_HEIGHT = 70;
const BILLET_NODESEP = 40;  // horizontal gap between sibling subtrees
const BILLET_RANKSEP = 80;  // vertical gap between ranks
const BILLET_MARGINX = 40;  // left margin for root subtrees

export function buildBilletGraph(
    billets: BilletChainNode[],
    allSuperiorIds: Set<string>,
    collapsedIds: Set<string>
): {
    nodes: Node<BilletNodeData>[];
    edges: Edge[];
} {
    if (!billets?.length) return { nodes: [], edges: [] };

    const billetIds = new Set(billets.map((b) => b.id));

    // Build parent→children map preserving query (priority) order
    const childrenOf = new Map<string, BilletChainNode[]>();
    for (const billet of billets) {
        if (billet.superiorBilletId && billetIds.has(billet.superiorBilletId)) {
            if (!childrenOf.has(billet.superiorBilletId)) childrenOf.set(billet.superiorBilletId, []);
            childrenOf.get(billet.superiorBilletId)!.push(billet);
        }
    }

    // Sort siblings using full-graph superior set so collapsed branch nodes still sort first.
    for (const children of childrenOf.values()) {
        children.sort((a, b) => (allSuperiorIds.has(a.id) ? 1 : 0) - (allSuperiorIds.has(b.id) ? 1 : 0));
    }

    const roots = billets.filter((b) => !b.superiorBilletId || !billetIds.has(b.superiorBilletId));

    // ── Custom compact tree layout ────────────────────────────────────────────
    // subtreeWidth: minimum width this node's subtree needs so no nodes overlap.
    // A leaf needs exactly one node width. An internal node needs at least the
    // sum of its children's subtree widths plus gaps between them.
    const widthCache = new Map<string, number>();
    function subtreeWidth(nodeId: string): number {
        if (widthCache.has(nodeId)) return widthCache.get(nodeId)!;
        const children = childrenOf.get(nodeId) ?? [];
        const w =
            children.length === 0
                ? BILLET_NODE_WIDTH
                : Math.max(
                      BILLET_NODE_WIDTH,
                      children.reduce((sum, c) => sum + subtreeWidth(c.id), 0) +
                          (children.length - 1) * BILLET_NODESEP
                  );
        widthCache.set(nodeId, w);
        return w;
    }

    const xMap = new Map<string, number>(); // top-left x for each node
    const yMap = new Map<string, number>(); // top-left y for each node

    // placeSubtree: assign positions recursively.
    // centerX is the horizontal centre of this subtree.
    // depth drives the vertical position (rank).
    function placeSubtree(nodeId: string, centerX: number, depth: number): void {
        xMap.set(nodeId, centerX - BILLET_NODE_WIDTH / 2);
        yMap.set(nodeId, depth * (BILLET_NODE_HEIGHT + BILLET_RANKSEP));

        const children = childrenOf.get(nodeId) ?? [];
        if (children.length === 0) return;

        const childWidths = children.map((c) => subtreeWidth(c.id));
        const totalWidth =
            childWidths.reduce((a, b) => a + b, 0) + (children.length - 1) * BILLET_NODESEP;

        let curX = centerX - totalWidth / 2;
        for (let i = 0; i < children.length; i++) {
            placeSubtree(children[i].id, curX + childWidths[i] / 2, depth + 1);
            curX += childWidths[i] + BILLET_NODESEP;
        }
    }

    // Lay root subtrees out left-to-right with gaps between them
    let curX = BILLET_MARGINX;
    for (const root of roots) {
        const w = subtreeWidth(root.id);
        placeSubtree(root.id, curX + w / 2, 0);
        curX += w + BILLET_NODESEP;
    }

    // Any billet not reachable from roots (disconnected / cycle) gets a fallback position
    const billetById = new Map(billets.map((b) => [b.id, b]));
    let orphanX = BILLET_MARGINX;
    for (const id of billetById.keys()) {
        if (!xMap.has(id)) {
            xMap.set(id, orphanX);
            yMap.set(id, -(BILLET_NODE_HEIGHT + BILLET_RANKSEP));
            orphanX += BILLET_NODE_WIDTH + BILLET_NODESEP;
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const nodes: Node<BilletNodeData>[] = [];
    const edges: Edge[] = [];

    for (const billet of billets) {
        const hasParent = !!billet.superiorBilletId && billetIds.has(billet.superiorBilletId);
        nodes.push({
            id: billet.id,
            type: "billetNode",
            position: { x: xMap.get(billet.id)!, y: yMap.get(billet.id)! },
            style: { width: BILLET_NODE_WIDTH, transition: "transform 250ms ease" },
            data: {
                role: billet.role,
                unitElementName: billet.unitElementName,
                unitElementIcon: billet.unitElementIcon,
                trooper: billet.trooper,
                hasParent,
                hasChildren: allSuperiorIds.has(billet.id),
                isCollapsed: collapsedIds.has(billet.id),
            },
        });

        if (hasParent) {
            edges.push({
                id: `${billet.superiorBilletId}->${billet.id}`,
                source: billet.superiorBilletId!,
                target: billet.id,
                type: "smoothstep",
            });
        }
    }

    return { nodes, edges };
}
