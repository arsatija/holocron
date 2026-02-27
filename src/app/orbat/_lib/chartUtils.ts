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
}

const BILLET_NODE_WIDTH = 230;
const BILLET_NODE_HEIGHT = 70;

export function buildBilletGraph(billets: BilletChainNode[]): {
    nodes: Node<BilletNodeData>[];
    edges: Edge[];
} {
    if (!billets?.length) return { nodes: [], edges: [] };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 20, marginx: 40, marginy: 40 });

    const billetIds = new Set(billets.map((b) => b.id));
    const superiorIds = new Set(
        billets
            .map((b) => b.superiorBilletId)
            .filter((id): id is string => !!id && billetIds.has(id))
    );

    // For each superior that has Reservist children, create a virtual spacer node in
    // dagre so reservists are ranked one level below regular billets. The virtual node
    // is only used for layout — it is never added to the React Flow nodes array.
    const reservistVirtualIds = new Map<string, string>(); // superiorId → virtual node id
    for (const billet of billets) {
        if (
            billet.role.toLowerCase().includes("reservist") &&
            billet.superiorBilletId &&
            billetIds.has(billet.superiorBilletId) &&
            !reservistVirtualIds.has(billet.superiorBilletId)
        ) {
            const virtualId = `__rsv__${billet.superiorBilletId}`;
            reservistVirtualIds.set(billet.superiorBilletId, virtualId);
            g.setNode(virtualId, { width: 1, height: 1 });
            g.setEdge(billet.superiorBilletId, virtualId);
        }
    }

    const nodes: Node<BilletNodeData>[] = [];
    const edges: Edge[] = [];

    for (const billet of billets) {
        const hasParent = !!billet.superiorBilletId && billetIds.has(billet.superiorBilletId);
        const isReservist = billet.role.toLowerCase().includes("reservist");
        g.setNode(billet.id, { width: BILLET_NODE_WIDTH, height: BILLET_NODE_HEIGHT });
        nodes.push({
            id: billet.id,
            type: "billetNode",
            position: { x: 0, y: 0 },
            data: {
                role: billet.role,
                unitElementName: billet.unitElementName,
                unitElementIcon: billet.unitElementIcon,
                trooper: billet.trooper,
                hasParent,
                hasChildren: superiorIds.has(billet.id),
            },
        });

        if (hasParent) {
            // Dagre edge: reservists route through the virtual spacer so they land
            // one rank below regular billets. React Flow edge always draws directly
            // from the actual superior.
            const dagreParentId =
                isReservist && reservistVirtualIds.has(billet.superiorBilletId!)
                    ? reservistVirtualIds.get(billet.superiorBilletId!)!
                    : billet.superiorBilletId!;
            g.setEdge(dagreParentId, billet.id);
            edges.push({
                id: `${billet.superiorBilletId}->${billet.id}`,
                source: billet.superiorBilletId!,
                target: billet.id,
                type: "smoothstep",
            });
        }
    }

    try {
        dagre.layout(g);
    } catch {
        // Fallback: simple grid layout if dagre fails
        nodes.forEach((node, i) => {
            node.position = { x: (i % 10) * (BILLET_NODE_WIDTH + 20), y: Math.floor(i / 10) * (BILLET_NODE_HEIGHT + 40) };
            node.style = { width: BILLET_NODE_WIDTH };
        });
        return { nodes, edges };
    }

    for (const node of nodes) {
        const pos = g.node(node.id);
        if (!pos) continue;
        node.position = { x: pos.x - BILLET_NODE_WIDTH / 2, y: pos.y - BILLET_NODE_HEIGHT / 2 };
        node.style = { width: BILLET_NODE_WIDTH };
    }

    return { nodes, edges };
}
